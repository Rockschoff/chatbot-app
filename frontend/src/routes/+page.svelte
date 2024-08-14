<script>
    import { onMount } from 'svelte';
    import { authHandlers, authStore } from '../stores/authStore';
    
    let isCreatingAccount = false;
    let fname = '';
    let lname = '';
    let email = '';
    let password = '';
    let confirmPassword = '';
    let acceptedPrivacyPolicy = false;
    let showPrivacyPolicyModal = false;

    let canvas;
    let ctx;
    let particlesArray;
    let mouse = {
        x: null,
        y: null,
        radius: 50
    };

    onMount(() => {
        canvas = document.getElementById('networkCanvas');
        ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        });

        window.addEventListener('mousemove', (event) => {
            mouse.x = event.x;
            mouse.y = event.y;
        });

        init();
        animate();
    });

	function init() {
		particlesArray = [];
		let numberOfParticles = (canvas.height * canvas.width) / 19000;
		for (let i = 0; i < numberOfParticles; i++) {
			let size = (Math.random() * 5) + 1;
			let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
			let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
			let directionX = (Math.random() * 1);
			let directionY = (Math.random() * 1);
			let color = '#000000';

			particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
		}
	}

	function animate() {
		requestAnimationFrame(animate);
		ctx.clearRect(0, 0, innerWidth, innerHeight);

		for (let i = 0; i < particlesArray.length; i++) {
			particlesArray[i].update();
		}
		connect();
	}

	function connect() {
		let opacityValue = 1;
		for (let a = 0; a < particlesArray.length; a++) {
			for (let b = a; b < particlesArray.length; b++) {
				let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x))
					+ ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
				if (distance < (canvas.width/7) * (canvas.height/7)) {
					opacityValue = 1 - (distance/20000);
					ctx.strokeStyle = 'rgba(140,140,140,' + opacityValue + ')';
					ctx.lineWidth = 1;
					ctx.beginPath();
					ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
					ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
					ctx.stroke();
				}
			}
		}
	}


	class Particle {
		constructor(x, y, directionX, directionY, size, color) {
			this.x = x;
			this.y = y;
			this.directionX = directionX;
			this.directionY = directionY;
			this.size = size;
			this.color = color;
		}
		draw() {
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
			ctx.fillStyle = this.color;
			ctx.fill();
		}
		update() {
			if (this.x > canvas.width || this.x < 0) {
				this.directionX = -this.directionX;
			}
			if (this.y > canvas.height || this.y < 0) {
				this.directionY = -this.directionY;
			}
			let dx = mouse.x - this.x;
			let dy = mouse.y - this.y;
			let distance = Math.sqrt(dx*dx + dy*dy);
			if (distance < mouse.radius + this.size) {
				if (mouse.x < this.x && this.x < canvas.width - this.size * 10) {
					this.x += 10;
				}
				if (mouse.x > this.x && this.x > this.size * 10) {
					this.x -= 10;
				}
				if (mouse.y < this.y && this.y < canvas.height - this.size * 10) {
					this.y += 10;
				}
				if (mouse.y > this.y && this.y > this.size * 10) {
					this.y -= 10;
				}
			}
			this.x += this.directionX;
			this.y += this.directionY;
			this.draw();
		}
	}



   
    async function handleSubmit() {
        if (!email || !password || (isCreatingAccount && !confirmPassword)) {
            alert('Please fill in all required fields.');
            return;
        }
        
        if (!acceptedPrivacyPolicy) {
            alert('Please accept the privacy policy to proceed.');
            return;
        }
        
        if (isCreatingAccount) {
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            try {
                await authHandlers.signup(email, password, fname, lname);
                console.log('Signup successful, redirecting...');
                window.location.href = './dashboard';
            } catch (err) {
                console.log('Signup error:', err);
                alert('Signup failed. Please try again.');
            }
        } else {
            try {
                await authHandlers.login(email, password);
                console.log('Login successful, redirecting...');
                window.location.href = './dashboard';
            } catch (err) {
                console.log('Login error:', err);
                alert('Login failed. Please check your credentials and try again.');
            }
        }
    }

    function toggleAccountCreation() {
        isCreatingAccount = !isCreatingAccount;
    }

    function openPrivacyPolicyModal() {
        showPrivacyPolicyModal = true;
    }

    function closePrivacyPolicyModal() {
        showPrivacyPolicyModal = false;
    }
</script>

<canvas id="networkCanvas" class="fixed inset-0 z-0"></canvas>

<div class="min-h-screen bg-[#fdf6ed] bg-opacity-80 flex flex-col items-center justify-center p-4 md:p-8 relative">
    <!-- Logo Section -->
    <div class="text-center mb-4 relative z-10">
        <img src="./logo.png" alt="IN-Q Logo" class="mx-auto w-auto h-24 md:w-auto md:h-32">
    </div>

    <!-- Title and Description -->
    <div class="text-center mb-16 relative z-10">
        <h2 class="text-4xl md:text-5xl font-bold text-gray-800 mb-2 heading-font">IN-Q Knowledge Center</h2>
        <p class="text-lg md:text-xl text-gray-600 mt-2">
            Your compliance companion. Expert-validated and tested.
        </p>
    </div>

    <!-- Input Form -->
    <div class="bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg p-8 rounded-2xl shadow-xl max-w-md w-full relative z-10 transform transition-all duration-300 hover:scale-105 -mt-6">
        <h1 class="text-3xl font-bold mb-6 text-gray-800">
            {isCreatingAccount ? 'Create Account' : 'Login'}
        </h1>

        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
            {#if isCreatingAccount}
                <div>
                    <label class="block text-gray-700 text-sm font-semibold mb-2" for="fname">First Name</label>
                    <input
                        class="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all duration-200"
                        id="fname"
                        type="text"
                        bind:value={fname}
                        placeholder="Enter your first name"
                    />
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-semibold mb-2" for="lname">Last Name</label>
                    <input
                        class="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all duration-200"
                        id="lname"
                        type="text"
                        bind:value={lname}
                        placeholder="Enter your last name"
                    />
                </div>
            {/if}
            <div>
                <label class="block text-gray-700 text-sm font-semibold mb-2" for="email">Email</label>
                <input
                    class="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all duration-200"
                    id="email"
                    type="email"
                    bind:value={email}
                    placeholder="Enter your email"
                />
            </div>
            <div>
                <label class="block text-gray-700 text-sm font-semibold mb-2" for="password">Password</label>
                <input
                    class="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all duration-200"
                    id="password"
                    type="password"
                    bind:value={password}
                    placeholder="Enter your password"
                />
            </div>
            {#if isCreatingAccount}
                <div>
                    <label class="block text-gray-700 text-sm font-semibold mb-2" for="confirmPassword">Confirm Password</label>
                    <input
                        class="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all duration-200"
                        id="confirmPassword"
                        type="password"
                        bind:value={confirmPassword}
                        placeholder="Confirm your password"
                    />
                </div>
            {/if}
            <div>
                <label class="flex items-center text-gray-600">
                    <input 
                        type="checkbox" 
                        bind:checked={acceptedPrivacyPolicy}
                        class="mr-2 h-4 w-4 text-pink-500 focus:ring-pink-300 border-gray-300 rounded-full"
                    >
                    <span class="text-sm">I accept the 
                        <button 
                            type="button" 
                            on:click={openPrivacyPolicyModal}
                            class="text-pink-500 hover:text-pink-600 underline focus:outline-none"
                        >
                            privacy policy
                        </button>
                    </span>
                </label>
            </div>
            <div class="flex items-center justify-between pt-4">
                <button
                    class="text-pink-500 hover:text-pink-600 text-sm font-semibold focus:outline-none transition-colors duration-200"
                    type="button"
                    on:click={toggleAccountCreation}
                >
                    {isCreatingAccount ? 'Already have an account?' : 'Create an account'}
                </button>
                <button
                    class="bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white font-bold py-2 px-6 rounded-full shadow-md transform hover:scale-105 transition-all duration-300"
                    type="submit"
                >
                    {isCreatingAccount ? 'Register' : 'Login'}
                </button>
            </div>
        </form>
    </div>
</div>

{#if showPrivacyPolicyModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white p-8 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-lg">
            <h2 class="text-3xl font-bold mb-4 text-gray-800">Privacy Policy</h2>
            <div class="mb-6 text-gray-600">
                <!-- Add your privacy policy content here -->
                <p>This is the privacy policy content. Please replace this with your actual privacy policy.</p>
            </div>
            <button 
                on:click={closePrivacyPolicyModal}
                class="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-200"
            >
                Close
            </button>
        </div>
    </div>
{/if}


<style>
    #networkCanvas {
        background: linear-gradient(to bottom right, #fdf6ed, #ffffff, #1f2937);
    }
</style>
