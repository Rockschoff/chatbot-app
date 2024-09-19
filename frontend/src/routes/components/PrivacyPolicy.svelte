<script>
    import {createEventDispatcher } from "svelte"
    const dispatch = createEventDispatcher()
    export let showPrivacyPolicyModal = true; // You can control this with a parent component's prop or function

    function closePrivacyPolicyModal() {
        dispatch("close")
    }
</script>

{#if showPrivacyPolicyModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white p-6 sm:p-8 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-lg">
            <h1 class="text-2xl font-bold mb-4">PRIVACY POLICY</h1>
                <p>Date of Last Revision: September 9, 2024</p>
                <p>Welcome to Innova-Q! Innova-Q, LLC, a Delaware limited liability company (“Innova-Q”, “our”, “us”, or “we”) provides software solutions and related services for Product Quality Management (the “Platform”). We care about your privacy and the Personal Information (defined below) you share with us.</p>
                <p>This Privacy Policy describes the Personal Information we collect from you and how it may be stored and processed in the United States. Our goal is to help explain why we are using and how we are protecting the Personal Information we collect about you, as well as how you can exercise your privacy rights. We recommend that you read this Privacy Policy in full to ensure you are completely informed about using Innova-Q’s Website, Platform, or Services (described below), or submitting any personal or financial information through the Innova-Q’s Website, or in using Innova-Q’s Platform or Services.</p>
                <p>This Privacy Policy does not apply to any third party, including through any application or content (including advertising), that may link to or be accessible from or through the Website.</p>
                <p>We encourage you to read this Privacy Policy carefully and take the time to get to know our privacy practices. By accessing the Website, Platform, and/or the Services, you are bound by all terms and conditions in this Privacy Policy. If you do not wish to be bound, you may not access the Website, Platform, and/or the Services.</p>
                
                <h2 class="text-xl font-bold mt-4">1. Definitions.</h2>
                <h3 class="text-lg font-semibold mt-2">a. Information Types.</h3>
                <p><strong>i. “Browser Information”</strong> means data or information provided by a browser, including the IP address, the website visited, network connection, device information, and other data.</p>
                <p><strong>ii. “Contact Information”</strong> means basic personal and business information, such as first and last name, company name, email address, postal address, phone number, and may include social media account information.</p>
                <p><strong>iii. “Device Information”</strong> means information about your device, such as device ID number, model, and manufacturer, version of your operating system and geographical region, collected from any devices when accessing our website or any of our services.</p>
                <p><strong>iv. “Usage Information”</strong> means information collected when you interact with the Innova-Q’s Website or any of our Services, including functionalities accessed, pages visited, and other interaction data.</p>

                <h3 class="text-lg font-semibold mt-2">b. “Customer”</h3>
                <p>means any person or entity who registers for Services.</p>

                <h3 class="text-lg font-semibold mt-2">c. “Customer Data”</h3>
                <p>means data coming from Customer’s IT systems that contain critical to food safety and quality management and safety systems.</p>

                <h3 class="text-lg font-semibold mt-2">d. “Personal Data” or “Personal Information”</h3>
                <p>means information that (i) relates to an identified or identifiable natural person, or (ii) identifies, relates to, describes, is capable of being associated with, or could reasonably be linked, directly or indirectly, with a particular consumer or household.</p>

                <h3 class="text-lg font-semibold mt-2">e. “Services”</h3>
                <p>means all Innova-Q content, services, and materials located on or accessible through the Platform, including the Quality Performance Forecast and the In-Q Center.</p>

                <h3 class="text-lg font-semibold mt-2">f. “Third-Party Products”</h3>
                <p>means any third-party information, website, product, service, or materials referenced in, accessible through, or provided in connection with, the Website or Services.</p>

                <h3 class="text-lg font-semibold mt-2">g. “Visitor”</h3>
                <p>means an entity or natural person that visits or interacts with the Website.</p>

                <h3 class="text-lg font-semibold mt-2">h. “Website”</h3>
                <p>means the Innova-Q website located at <a href="https://innovaqual.com/" class="text-blue-500 hover:underline">https://innovaqual.com/</a>.</p>

                <h2 class="text-xl font-bold mt-4">2. How Do We Collect Information and What Information Do We Collect?</h2>
                <p>
                    a. When Customers use our Platform or Visitors browse our Website, or engage in communications with us online or offline, we may collect and control, as applicable, Personal Information, Browser Information, Contact Information, and Usage Information submitted or communicated to us.
                </p>
                <p>
                    b. We shall collect additional information from the Customer, including Customer Data, when the Customer uses our Platform in order to provide our Services.
                </p>
                <p>
                    c. We may collect the following types of information from you or your device(s):
                </p>
                <ul class="list-disc pl-6">
                    <li>identifiers, such as Browser Information and Device Information;</li>
                    <li>commercial information, such as Contact Information and Usage Information;</li>
                    <li>internet or network information, such as Browser Information and Device Information;</li>
                    <li>geolocation data, such as Browser Information and Device Information;</li>
                    <li>production data, such as Customer Data;</li>
                    <li>other Personal Information, and/or</li>
                    <li>information derived from other categories, which could include your preferences, interests, and other information used to personalize your experience.</li>
                </ul>

                <h2 class="text-xl font-bold mt-4">3. How Do We Use the Information We Collect?</h2>
                <p>
                    We use the information we collect in our role as a Controller to:
                </p>
                <ul class="list-disc pl-6">
                    <li>Provide information or Services requested by you;</li>
                    <li>Developing and managing the Platform;</li>
                    <li>Manage our relationship with you;</li>
                    <li>Improving the effectiveness of our Website, marketing endeavors, and Services;</li>
                    <li>Detect, investigate, and prevent fraudulent transactions and other illegal or unauthorized activities and protect the rights and property of Innova-Q;</li>
                    <li>Providing customer service;</li>
                    <li>Notifying you of any information concerning the Services;</li>
                    <li>Sending you automated email messages, text messages (message and data rates may apply), or marketing materials regarding our Services;</li>
                    <li>Sending you newsletters and other communications that you can opt-out of;</li>
                    <li>Sending you direct mail offerings;</li>
                    <li>Sending you email communications about our Services, promotions, events, or other important information that you opt into;</li>
                    <li>Sending you email communications about content you included on our Website;</li>
                    <li>Sending you technical notices, updates, security alerts, and support messages;</li>
                    <li>Enabling you to participate in the Website's features;</li>
                    <li>Training machine learning and processing your analytics for you;</li>
                    <li>Identifying your Services preferences and informing you of new or additional products, services, and promotions that may be of interest to you;</li>
                    <li>For internal business purposes such as trainings and business development;</li>
                    <li>Notifying you about important changes to our Website;</li>
                    <li>For purposes disclosed at the time you provide your information or as otherwise discussed in this Privacy Policy.</li>
                </ul>

                <h2 class="text-xl font-bold mt-4">4. How Do We Share the Information We Collect?</h2>
                <p>
                    a. We may access, transfer, or disclose the Personal Data with your consent or if we have a good faith belief that doing so is necessary to: (i) comply with applicable law or respond to valid legal process, including from law enforcement or other government agencies; or (ii) protect the rights or property of Innova-Q, including enforcing the terms governing the use of the Services.
                </p>
                <p>
                    b. Like many organizations, the Personal Information we collect may be shared with third-parties to enable us to provide our Services to you. We may hire other companies to perform certain business-related functions on our behalf, and we may provide access to or share your information with these companies so they can perform services for us. Examples of such functions include marketing, mailing information, data storage, security, fraud preventions, donation and payment processing, legal services, accounting services, and maintaining databases.
                </p>
                <p>
                    c. By providing these third-party companies your Personal Information, they are not permitted to use, share, or sell said information; however, they have their own privacy policies with respect to the information we share with them to provide our Services. This includes how they may process and store your Personal Information.
                </p>
                <p>
                    d. We use Stripe as our payment processor for Basic Subscriptions of the In-Q Center and our relationship with Stripe is subject to the Stripe Services Agreement, which may be amended by Stripe from time-to-time. Your data that is collected and maintained by Stripe in order to provide payment processing services on our Website and for our Services is subject to Stripe's Privacy Policy.
                </p>

                <h2 class="text-xl font-bold mt-4">5. How Do We Store the Information We Collect?</h2>
                <p>
                    Innova-Q stores and maintains collected information, which may include Personal Information, Contact Information, Usage Information, and Customer Data as long as is commercially reasonable to provide you with our Services, comply with any applicable laws, resolve disputes, and enforce any of our agreements, or the other purposes described in this Privacy Policy. We may retain your Personal Information for longer periods if we have obtained your consent to use or retain your Personal Information for another or similar purpose. We may also retain your Personal Information for any such period as may be required by applicable law.
                </p>
                <p>
                    Innova-Q ensures that all data handling practices meet or exceed industry standards for data protection, confidentiality, and integrity, including the use of encryptions, VPNs, and multi-factor authentication steps. Regular security audits and monitoring are conducted to identify and address potential vulnerabilities. Usage metrics are analyzed to detect and prevent malicious activities, ensuring ongoing compliance with security policies.
                </p>
                <p>
                    Because these needs can vary for different information types in the context of different products, actual retention periods can vary based on criteria such as user expectations or consent, the sensitivity of the information, the availability of automated controls that enable users to delete information, and our legal or contractual obligations. If you have any questions concerning our retention of your information, please contact Innova-Q at <a href="mailto:support@innovaqual.com" class="text-blue-500 hover:underline">support@innovaqual.com</a>.
                </p>

                <h2 class="text-xl font-bold mt-4">6. Minors and COPPA Compliance</h2>
                <p>
                    The Services and Platform are only available for adults 18 or older. If we learn we have collected or received Personal Information from a child under 13, we will delete that information in accordance with the Children's Online Privacy Protection Act (“COPPA”). If you believe we might have any information from or about a child under 13, please contact us at <a href="mailto:support@innovaqual.com" class="text-blue-500 hover:underline">support@innovaqual.com</a>, and we will take reasonable steps to ensure that such information is deleted from our records.
                </p>

                <h2 class="text-xl font-bold mt-4">7. Third Parties</h2>
                <p>
                    a. Third Parties may collect additional information from you. Please refer to the respective Third Party’s Privacy Policy to better understand how they process any of the personal information they collect and the purposes for collection. While we are dedicated to securing our Website and Services, you are responsible for securing and maintaining the privacy of your passwords and account information. We are not responsible for protecting Personal Data shared with a Third Party based on a connection that you have authorized.
                </p>
                <p>
                    b. We do not control third parties' collection or use of your information to serve interest-based advertising. However, these third parties may provide you with ways to choose not to have your information collected or used in this way. You can opt out of receiving targeted ads from members of the Network Advertising Initiative ("NAI") on the NAI's website.
                </p>

                <h2 class="text-xl font-bold mt-4">8. Promotional Offers from Innova-Q</h2>
                <p>
                    If you do not wish to have your Contact Information used by Innova-Q to promote our products or services, you can opt-out by sending us an email stating your request to <a href="mailto:support@innovaqual.com" class="text-blue-500 hover:underline">support@innovaqual.com</a>. If we have sent you a promotional email, you may send us a return email asking to be omitted from future email distributions.
                </p>

                <h2 class="text-xl font-bold mt-4">9. Data Subject’s Rights</h2>
                <p>
                    State consumer privacy laws may provide their residents with additional rights regarding our use of their personal information. Innova-Q’s Services are available in all fifty states.
                </p>
                <p>
                    a. California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa, Montana, Oregon, Tennessee, Texas, Utah, and Virginia provide their state residents with rights to:
                </p>
                <ul class="list-disc pl-6">
                    <li>Confirm whether we process their personal information.</li>
                    <li>Access and delete certain personal information.</li>
                    <li>Correct inaccuracies in their personal information, taking into account the information's nature processing purpose (excluding Iowa and Utah).</li>
                    <li>Data portability.</li>
                    <li>Opt-out of personal data processing for targeted advertising (excluding Iowa); sales; or profiling in furtherance of decisions that produce legal or similarly significant effects (excluding Iowa and Utah).</li>
                    <li>Either limit (opt-out of) or require consent to process sensitive personal data.</li>
                </ul>
                <p>
                    b. Nevada provides its residents with a limited right to opt-out of certain personal information sales. Residents who wish to exercise this sale opt-out rights may submit a request to <a href="mailto:info@innovaqual.com" class="text-blue-500 hover:underline">info@innovaqual.com</a>. However, please know we do not currently sell data triggering that statute's opt-out requirements.
                </p>

                <h2 class="text-xl font-bold mt-4">10. International Data Subject’s Rights</h2>
                <p>
                    a. Residents of the United Kingdom (“UK”), European Union, or European Economic Area (“EEA”) may have certain data protection rights. If you are located in the EEA or UK, you freely consent to the transfer of personal information outside of the EEA and UK. Your consent to this Privacy Policy together with your submission of personal information constitutes your agreement to these transfers.
                </p>
                <p>
                    b. Rights of EEA and UK Residents:
                </p>
                <ul class="list-disc pl-6">
                    <li>Right of Access: You have the right to obtain confirmation from us as to whether or not we process personal information from you.</li>
                    <li>Right to Correction: You have the right to require us to correct inaccurate or incomplete personal information.</li>
                    <li>Right to Deletion or Restriction of Processing: You may have the right to require us to delete or restrict processing of your personal information.</li>
                    <li>Right to Withdraw Consent: You have the right to withdraw your consent at any time.</li>
                    <li>Right to Data Portability: You may have the right to receive personal information provided to us, in a machine-readable format.</li>
                    <li>Right to Lodge a Complaint with a Supervisory Authority.</li>
                </ul>

                <h2 class="text-xl font-bold mt-4">11. Credit Card Information</h2>
                <p>
                    Innova-Q does not process credit card information for payment for any Services you may order from our Website. We contract with a third-party service provider that complies with PCI DSS to collect and process your credit card information.
                </p>

                <h2 class="text-xl font-bold mt-4">12. Do Not Track</h2>
                <p>
                    Do Not Track is a privacy preference that Visitors can set in their web browsers. When a Visitor turns on the Do Not Track signal, the browser sends a message to websites requesting them not to track the Visitor. At this time, we do not respond to web browser “do not track” settings or signals.
                </p>

                <h2 class="text-xl font-bold mt-4">13. International Data Transfers</h2>
                <p>
                    All information processed by us may be transferred, processed, and stored anywhere in the world, including but not limited to, countries which may have data protection laws that are different from the laws where you live.
                </p>

                <h2 class="text-xl font-bold mt-4">14. Protecting Your Personal Information</h2>
                <p>
                    We implement security measures designed to maintain the security of your Personal Information. However, no method of safeguarding information is completely secure. While we use measures designed to protect Personal Information, we cannot guarantee that our safeguards will be effective or sufficient. In addition, you should be aware that internet data transmission is not always secure, and we cannot warrant that information you transmit utilizing the Services is or will be secure.
                </p>

                <h2 class="text-xl font-bold mt-4">15. Transfer of Data</h2>
                <p>
                    Your Personal Information may be transferred to—and maintained on—computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ from those in your jurisdiction. We will take steps reasonably designed to treat your Personal Information securely and in accordance with this Privacy Policy, as further described below.
                </p>

                <h2 class="text-xl font-bold mt-4">16. Supervisory Authority</h2>
                <p>
                    If you are located in the EEA, Switzerland, UK, India, China, or Brazil, you have the right to lodge a complaint with a supervisory authority if you believe our processing of your personal information violates applicable law.
                </p>

                <h2 class="text-xl font-bold mt-4">17. Updates</h2>
                <p>
                    We may update this Privacy Policy from time to time in response to changing legal, technical, or business developments. When we update our Privacy Policy, we will take appropriate measures to inform you, consistent with the significance of the changes we make. We will obtain your consent to any material Privacy Policy changes if and where this is required by applicable data protection laws. You can see when this Privacy Policy was last updated by checking the “Date of Last Revision” date displayed at the top of this Privacy Policy.
                </p>

                <h2 class="text-xl font-bold mt-4">18. Contact Us</h2>
                <p>
                    For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail or by mail using the details provided below. Please note that email communications will not necessarily be secure; accordingly, you should not include credit card information or other sensitive information in your e-mail correspondence with us.
                </p>
                <p>
                    <strong>Innova-Q, LLC</strong><br>
                    Attn: Privacy Policy / Data Privacy Rights<br>
                    <a href="mailto:support@innovaqual.com" class="text-blue-500 hover:underline">support@innovaqual.com</a>
                </p>
            <button 
                on:click={closePrivacyPolicyModal}
                class="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-200 w-full sm:w-auto mt-6"
            >
                Close
            </button>
        </div>
    </div>
{/if}

<style>
    .modal-content {
        max-height: 80vh;
        overflow-y: auto;
    }
</style>
