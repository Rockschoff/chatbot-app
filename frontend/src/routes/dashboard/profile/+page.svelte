<script lang="ts">
    import { authStore, authHandlers } from '../../../stores/authStore';
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import {
      faUserCircle,
      faEnvelope,
      faLock,
      faArrowLeft,
      faCheckCircle
    } from '@fortawesome/free-solid-svg-icons';
    import { goto } from '$app/navigation';
  
    let originalName: string = '';
    let originalEmail: string = '';
    let name: string = '';
    let email: string = '';
    let password: string = '';
    let loading: boolean = false;
    let passwordError: string = '';
  
    $: {
      if ($authStore.currentUser) {
        originalName = $authStore.currentUser.displayName || '';
        originalEmail = $authStore.currentUser.email || '';
        name = originalName;
        email = originalEmail;
      }
    }
  
    function hasChanges() {
      return name !== originalName || email !== originalEmail || password !== '';
    }
  
    function validatePassword() {
      const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9])(?=.*[a-z]).{8,}$/;
      if (password && !passwordPattern.test(password)) {
        passwordError = 'Password must be at least 8 characters long and contain at least one uppercase letter, one special character, and one number.';
        return false;
      }
      passwordError = '';
      return true;
    }
  
    async function updateProfile() {
      if (!validatePassword()) return;
      loading = true;
      try {
        if (name !== originalName) {
          await authHandlers.updateName($authStore.currentUser, name);
        }
        if (email !== originalEmail) {
          await authHandlers.updateEmail(email);
        }
        if (password) {
          await authHandlers.updatePassword(password);
        }
        alert('Profile updated successfully!');
        originalName = name;
        originalEmail = email;
        password = '';
      } catch (error) {
        alert(`Error updating profile: ${error.message}`);
      } finally {
        loading = false;
      }
    }
  
    function goBack() {
      goto('/dashboard');
    }
  
    const subscriptionPlans = [
      {
        name: 'Free',
        price: 0,
        features: ['Limited features', '1GB storage', 'Basic support']
      },
      {
        name: 'Basic',
        price: 25,
        features: ['All Free features', '10GB storage', 'Priority support', 'Custom branding']
      },
      {
        name: 'Enterprise',
        price: 100,
        features: [
          'All Basic features',
          'Unlimited storage',
          '24/7 support',
          'Advanced analytics',
          'Dedicated account manager'
        ]
      }
    ];
  </script>
  
  <style>
    .profile-card {
      animation: fadeIn 0.5s ease-out;
    }
  
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  
    .subscription-plan {
      background-image: linear-gradient(to right, transparent, var(--tw-gradient-stops));
      --tw-gradient-from: transparent;
      --tw-gradient-to: transparent;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-color), var(--tw-gradient-to);
    }
  
    .subscription-plan.Free {
      --tw-gradient-color: #f8f9fa;
    }
  
    .subscription-plan.Basic {
      --tw-gradient-color: #4c6ef5;
    }
  
    .subscription-plan.Enterprise {
      --tw-gradient-color: #343a40;
    }
  </style>
  
  <div class="flex justify-center items-center min-h-screen bg-blue-100">
    <div class="profile-card bg-white shadow-md rounded-lg p-8 max-w-4xl w-full relative">
      <button on:click={goBack} class="absolute top-4 left-4 text-blue-500 hover:text-blue-600 focus:outline-none">
        <FontAwesomeIcon icon={faArrowLeft} class="w-6 h-6" />
      </button>
      <div class="flex">
        <div class="w-1/3 p-4">
          {#if $authStore.currentUser?.photoURL}
            <img src={$authStore.currentUser.photoURL} alt="Profile Picture" class="w-40 h-40 rounded-full mx-auto mb-4 shadow-md" />
          {:else}
            <FontAwesomeIcon icon={faUserCircle} class="text-gray-400 w-40 h-40 mx-auto mb-4 shadow-md" />
          {/if}
          <div class="text-center">
            <h2 class="text-xl font-semibold mb-2">{name}</h2>
            <p class="text-gray-500 mb-4">{email}</p>
          </div>
        </div>
        <div class="w-2/3 p-4 border-l">
          <form on:submit|preventDefault={updateProfile} class="space-y-4">
            <div class="flex items-center space-x-2">
              <FontAwesomeIcon icon={faUserCircle} class="text-gray-400" />
              <input type="text" bind:value={name} placeholder="Name" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
  
            <div class="flex items-center space-x-2">
              <FontAwesomeIcon icon={faEnvelope} class="text-gray-400" />
              <input type="email" bind:value={email} placeholder="Email" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
  
            <div class="flex items-center space-x-2">
              <FontAwesomeIcon icon={faLock} class="text-gray-400" />
              <input type="password" bind:value={password} placeholder="Password" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {#if passwordError}
              <p class="text-red-500">{passwordError}</p>
            {/if}
  
            {#if hasChanges()}
              <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 {loading ? 'opacity-50 cursor-not-allowed' : ''}">
                {#if loading}
                  <div class="flex items-center justify-center">
                    <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span class="ml-2">Updating...</span>
                  </div>
                {:else}
                  Update Profile
                {/if}
              </button>
            {/if}
          </form>
        </div>
      </div>
    </div>
  </div>
  
  <div class="p-20 bg-blue-100">
    <h2 class="text-2xl font-bold mb-4 text-center">Subscription Plans</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {#each subscriptionPlans as plan}
        <div class="subscription-plan relative p-6 rounded-lg hover:shadow-lg transform transition duration-300 ease-in-out bg-white {plan.name.toLowerCase()}">
          <div class="absolute inset-0 rounded-lg border-4 border-transparent bg-clip-border"></div>
          <div class="relative z-10 p-6 bg-white rounded-lg">
            <h3 class="text-2xl font-bold mb-2 text-{plan.name.toLowerCase()}-500">{plan.name}</h3>
            <p class="price text-4xl font-bold text-gray-800 mb-4">${plan.price}/month</p>
            <ul class="text-gray-600 mb-6 space-y-2">
              {#each plan.features as feature}
                <li class="flex items-center">
                  <FontAwesomeIcon icon={faCheckCircle} class="text-green-500 mr-2" />
                  {feature}
                </li>
              {/each}
            </ul>
            <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              Subscribe
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>