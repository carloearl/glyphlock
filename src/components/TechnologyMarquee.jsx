import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function TechnologyMarquee() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const row1Logos = [
    { name: "AWS", logo: "https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-ar21.svg" },
    { name: "Google Cloud", logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg" },
    { name: "Microsoft Azure", logo: "https://www.vectorlogo.zone/logos/microsoft_azure/microsoft_azure-ar21.svg" },
    { name: "Vercel", logo: "https://www.vectorlogo.zone/logos/vercel/vercel-ar21.svg" },
    { name: "Docker", logo: "https://www.vectorlogo.zone/logos/docker/docker-ar21.svg" },
    { name: "PostgreSQL", logo: "https://www.vectorlogo.zone/logos/postgresql/postgresql-ar21.svg" },
    { name: "MongoDB", logo: "https://www.vectorlogo.zone/logos/mongodb/mongodb-ar21.svg" },
    { name: "Redis", logo: "https://www.vectorlogo.zone/logos/redis/redis-ar21.svg" },
    { name: "OpenAI", logo: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" },
    { name: "NVIDIA", logo: "https://www.vectorlogo.zone/logos/nvidia/nvidia-ar21.svg" },
    { name: "Hugging Face", logo: "https://huggingface.co/front/assets/huggingface_logo.svg" },
    { name: "GitHub", logo: "https://www.vectorlogo.zone/logos/github/github-ar21.svg" },
    { name: "Cloudflare", logo: "https://www.vectorlogo.zone/logos/cloudflare/cloudflare-ar21.svg" },
    { name: "Stripe", logo: "https://logo.clearbit.com/stripe.com" },
    { name: "Square", logo: "https://logo.clearbit.com/squareup.com" },
    { name: "Kubernetes", logo: "https://www.vectorlogo.zone/logos/kubernetes/kubernetes-ar21.svg" },
    { name: "Terraform", logo: "https://www.vectorlogo.zone/logos/terraformio/terraformio-ar21.svg" },
    { name: "Supabase", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Supabase_Logo.svg" },
    { name: "React", logo: "https://www.vectorlogo.zone/logos/reactjs/reactjs-ar21.svg" },
    { name: "Node.js", logo: "https://www.vectorlogo.zone/logos/nodejs/nodejs-ar21.svg" },
    { name: "Python", logo: "https://www.vectorlogo.zone/logos/python/python-ar21.svg" },
    { name: "TypeScript", logo: "https://www.vectorlogo.zone/logos/typescriptlang/typescriptlang-ar21.svg" },
    { name: "Next.js", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Nextjs-logo.svg" },
    { name: "TailwindCSS", logo: "https://www.vectorlogo.zone/logos/tailwindcss/tailwindcss-ar21.svg" },
    { name: "GraphQL", logo: "https://www.vectorlogo.zone/logos/graphql/graphql-ar21.svg" },
    { name: "Auth0", logo: "https://www.vectorlogo.zone/logos/auth0/auth0-ar21.svg" },
    { name: "CrowdStrike", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3e/CrowdStrike_logo.svg" },
    { name: "Palo Alto", logo: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Palo_Alto_Networks_logo.svg" },
    { name: "Fortinet", logo: "https://upload.wikimedia.org/wikipedia/commons/6/62/Fortinet_logo.svg" },
    { name: "Check Point", logo: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Check_Point_Logo.svg" },
    { name: "Zscaler", logo: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Zscaler_logo.svg" },
    { name: "Claude", logo: "https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg" },
    { name: "Gemini", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" },
    { name: "Cisco", logo: "https://www.vectorlogo.zone/logos/cisco/cisco-ar21.svg" },
    { name: "Okta", logo: "https://www.vectorlogo.zone/logos/okta/okta-ar21.svg" },
    { name: "Datadog", logo: "https://www.vectorlogo.zone/logos/datadoghq/datadoghq-ar21.svg" },
    { name: "Grafana", logo: "https://www.vectorlogo.zone/logos/grafana/grafana-ar21.svg" },
    { name: "Sentry", logo: "https://www.vectorlogo.zone/logos/sentry/sentry-ar21.svg" },
    { name: "Netlify", logo: "https://www.vectorlogo.zone/logos/netlify/netlify-ar21.svg" },
    { name: "Firebase", logo: "https://upload.wikimedia.org/wikipedia/commons/b/bd/Firebase_Logo.png" },
    { name: "Heroku", logo: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Heroku_logo.svg" },
    { name: "DigitalOcean", logo: "https://www.vectorlogo.zone/logos/digitalocean/digitalocean-ar21.svg" },
    { name: "Ansible", logo: "https://www.vectorlogo.zone/logos/ansible/ansible-ar21.svg" },
    { name: "Jenkins", logo: "https://www.vectorlogo.zone/logos/jenkins/jenkins-ar21.svg" },
    { name: "CircleCI", logo: "https://www.vectorlogo.zone/logos/circleci/circleci-ar21.svg" },
    { name: "Travis CI", logo: "https://www.vectorlogo.zone/logos/travis-ci/travis-ci-ar21.svg" },
    { name: "GitLab", logo: "https://www.vectorlogo.zone/logos/gitlab/gitlab-ar21.svg" },
    { name: "Bitbucket", logo: "https://www.vectorlogo.zone/logos/bitbucket/bitbucket-ar21.svg" },
    { name: "Jira", logo: "https://www.vectorlogo.zone/logos/atlassian_jira/atlassian_jira-ar21.svg" },
    { name: "Confluence", logo: "https://www.vectorlogo.zone/logos/atlassian_confluence/atlassian_confluence-ar21.svg" },
    { name: "Slack", logo: "https://www.vectorlogo.zone/logos/slack/slack-ar21.svg" },
    { name: "Microsoft Teams", logo: "https://www.vectorlogo.zone/logos/microsoft_teams/microsoft_teams-ar21.svg" },
    { name: "Zoom", logo: "https://www.vectorlogo.zone/logos/zoom/zoom-ar21.svg" },
    { name: "Discord", logo: "https://www.vectorlogo.zone/logos/discordapp/discordapp-ar21.svg" },
    { name: "Twilio", logo: "https://www.vectorlogo.zone/logos/twilio/twilio-ar21.svg" },
    { name: "SendGrid", logo: "https://www.vectorlogo.zone/logos/sendgrid/sendgrid-ar21.svg" },
    { name: "Mailchimp", logo: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Mailchimp_Logo.svg" },
    { name: "Postman", logo: "https://www.vectorlogo.zone/logos/getpostman/getpostman-ar21.svg" },
    { name: "Insomnia", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Insomnia_Logo.svg" },
    { name: "Nginx", logo: "https://www.vectorlogo.zone/logos/nginx/nginx-ar21.svg" },
    { name: "Apache", logo: "https://www.vectorlogo.zone/logos/apache/apache-ar21.svg" },
    { name: "Linux", logo: "https://www.vectorlogo.zone/logos/linux/linux-ar21.svg" },
    { name: "Ubuntu", logo: "https://www.vectorlogo.zone/logos/ubuntu/ubuntu-ar21.svg" },
    { name: "Debian", logo: "https://www.vectorlogo.zone/logos/debian/debian-ar21.svg" },
    { name: "CentOS", logo: "https://www.vectorlogo.zone/logos/centos/centos-ar21.svg" },
    { name: "Fedora", logo: "https://www.vectorlogo.zone/logos/getfedora/getfedora-ar21.svg" },
    { name: "Vim", logo: "https://www.vectorlogo.zone/logos/vim/vim-ar21.svg" },
    { name: "VS Code", logo: "https://www.vectorlogo.zone/logos/visualstudio_code/visualstudio_code-ar21.svg" },
    { name: "Figma", logo: "https://www.vectorlogo.zone/logos/figma/figma-ar21.svg" },
    { name: "Sketch", logo: "https://www.vectorlogo.zone/logos/sketchapp/sketchapp-ar21.svg" },
    { name: "Adobe XD", logo: "https://www.vectorlogo.zone/logos/adobe/adobe-ar21.svg" },
    { name: "Framer", logo: "https://upload.wikimedia.org/wikipedia/commons/5/59/Framer_Logo.svg" },
    { name: "Webflow", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Webflow_Logo.svg" },
    { name: "WordPress", logo: "https://www.vectorlogo.zone/logos/wordpress/wordpress-ar21.svg" },
    { name: "Shopify", logo: "https://www.vectorlogo.zone/logos/shopify/shopify-ar21.svg" },
    { name: "Magento", logo: "https://www.vectorlogo.zone/logos/magento/magento-ar21.svg" },
    { name: "Replit", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b2/Repl.it_logo.svg" },
    { name: "Greylock", logo: "https://upload.wikimedia.org/wikipedia/commons/4/40/Greylock_Partners_logo.svg" },
    { name: "Y Combinator", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b2/Y_Combinator_logo.svg" },
    { name: "Sequoia", logo: "https://upload.wikimedia.org/wikipedia/commons/2/20/Sequoia_Capital_logo.svg" },
    { name: "Andreessen Horowitz", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Andreessen_Horowitz_logo.svg" },
    { name: "Accel", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Accel_logo.svg" },
    { name: "CyberArk", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9f/CyberArk_Logo.svg" },
    { name: "Rapid7", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Rapid7_logo.svg" },
    { name: "Tenable", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Tenable_logo.svg" },
    { name: "SentinelOne", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e3/SentinelOne_Logo.svg" },
    { name: "McAfee", logo: "https://upload.wikimedia.org/wikipedia/commons/0/00/McAfee_logo.svg" },
    { name: "Norton", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a7/NortonLifeLock_logo.svg" },
    { name: "Sophos", logo: "https://upload.wikimedia.org/wikipedia/commons/8/89/Sophos_logo.svg" },
    { name: "Duo Security", logo: "https://upload.wikimedia.org/wikipedia/commons/5/57/Duo_Security_logo.svg" },
    { name: "1Password", logo: "https://upload.wikimedia.org/wikipedia/commons/6/68/1Password_logo.svg" },
    { name: "Bitwarden", logo: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Bitwarden_logo.svg" },
    { name: "Netflix", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" },
    { name: "Uber", logo: "https://upload.wikimedia.org/wikipedia/commons/5/58/Uber_logo_2018.svg" },
    { name: "Airbnb", logo: "https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg" },
    { name: "Twitter", logo: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg" },
    { name: "LinkedIn", logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" },
    { name: "Reddit", logo: "https://upload.wikimedia.org/wikipedia/commons/5/58/Reddit_logo_new.svg" },
    { name: "TikTok", logo: "https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg" },
    { name: "Snapchat", logo: "https://upload.wikimedia.org/wikipedia/en/c/c4/Snapchat_logo.svg" },
    { name: "US Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2d/US_Bank_logo_2020.svg" },
    { name: "Elavon", logo: "https://logo.clearbit.com/elavon.com" },
    { name: "GoDaddy", logo: "https://upload.wikimedia.org/wikipedia/commons/3/36/GoDaddy_logo.svg" },
    { name: "Base44", logo: "https://avatars.githubusercontent.com/u/145019558?s=200&v=4" }
  ];

  const row2Logos = [
    { name: "Salesforce", logo: "https://www.vectorlogo.zone/logos/salesforce/salesforce-ar21.svg" },
    { name: "Oracle", logo: "https://www.vectorlogo.zone/logos/oracle/oracle-ar21.svg" },
    { name: "SAP", logo: "https://www.vectorlogo.zone/logos/sap/sap-ar21.svg" },
    { name: "IBM", logo: "https://www.vectorlogo.zone/logos/ibm/ibm-ar21.svg" },
    { name: "ServiceNow", logo: "https://upload.wikimedia.org/wikipedia/commons/5/57/ServiceNow_logo.svg" },
    { name: "Workday", logo: "https://www.vectorlogo.zone/logos/workday/workday-ar21.svg" },
    { name: "HashiCorp", logo: "https://www.vectorlogo.zone/logos/hashicorp/hashicorp-ar21.svg" },
    { name: "VMware", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Vmware.svg" },
    { name: "Splunk", logo: "https://www.vectorlogo.zone/logos/splunk/splunk-ar21.svg" },
    { name: "Elastic", logo: "https://www.vectorlogo.zone/logos/elastic/elastic-ar21.svg" },
    { name: "New Relic", logo: "https://www.vectorlogo.zone/logos/newrelic/newrelic-ar21.svg" },
    { name: "Snyk", logo: "https://www.vectorlogo.zone/logos/snyk/snyk-ar21.svg" },
    { name: "Qualcomm", logo: "https://www.vectorlogo.zone/logos/qualcomm/qualcomm-ar21.svg" },
    { name: "Broadcom", logo: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Broadcom_Corporation_Logo.svg" },
    { name: "Intel", logo: "https://www.vectorlogo.zone/logos/intel/intel-ar21.svg" },
    { name: "AMD", logo: "https://www.vectorlogo.zone/logos/amd/amd-ar21.svg" },
    { name: "Snowflake", logo: "https://www.vectorlogo.zone/logos/snowflake/snowflake-ar21.svg" },
    { name: "Databricks", logo: "https://www.vectorlogo.zone/logos/databricks/databricks-ar21.svg" },
    { name: "Tableau", logo: "https://www.vectorlogo.zone/logos/tableau/tableau-ar21.svg" },
    { name: "Looker", logo: "https://www.vectorlogo.zone/logos/looker/looker-ar21.svg" },
    { name: "Segment", logo: "https://www.vectorlogo.zone/logos/segment/segment-ar21.svg" },
    { name: "Amplitude", logo: "https://www.vectorlogo.zone/logos/amplitude/amplitude-ar21.svg" },
    { name: "Mixpanel", logo: "https://www.vectorlogo.zone/logos/mixpanel/mixpanel-ar21.svg" },
    { name: "LaunchDarkly", logo: "https://www.vectorlogo.zone/logos/launchdarkly/launchdarkly-ar21.svg" },
    { name: "PagerDuty", logo: "https://www.vectorlogo.zone/logos/pagerduty/pagerduty-ar21.svg" },
    { name: "Perplexity", logo: "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/perplexity-ai-icon.png" },
    { name: "Anthropic", logo: "https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg" },
    { name: "Cohere", logo: "https://www.vectorlogo.zone/logos/cohere/cohere-ar21.svg" },
    { name: "Varonis", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Varonis_logo.svg" },
    { name: "Ping Identity", logo: "https://upload.wikimedia.org/wikipedia/commons/7/73/Ping_Identity_logo.svg" },
    { name: "JumpCloud", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7f/JumpCloud_logo.svg" },
    { name: "Clover", logo: "https://logo.clearbit.com/clover.com" },
    { name: "Toast POS", logo: "https://logo.clearbit.com/toasttab.com" }
  ];

  const row3Logos = [
    { name: "Apple", logo: "https://www.vectorlogo.zone/logos/apple/apple-ar21.svg" },
    { name: "Microsoft", logo: "https://www.vectorlogo.zone/logos/microsoft/microsoft-ar21.svg" },
    { name: "Google", logo: "https://www.vectorlogo.zone/logos/google/google-ar21.svg" },
    { name: "Meta", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg" },
    { name: "Amazon", logo: "https://www.vectorlogo.zone/logos/amazon/amazon-ar21.svg" },
    { name: "Tesla", logo: "https://www.vectorlogo.zone/logos/tesla/tesla-ar21.svg" },
    { name: "SpaceX", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2e/SpaceX_logo_black.svg" },
    { name: "PayPal", logo: "https://www.vectorlogo.zone/logos/paypal/paypal-ar21.svg" },
    { name: "Visa", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" },
    { name: "Mastercard", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" },
    { name: "American Express", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" },
    { name: "Adyen", logo: "https://www.vectorlogo.zone/logos/adyen/adyen-ar21.svg" },
    { name: "Braintree", logo: "https://www.vectorlogo.zone/logos/braintreepayments/braintreepayments-ar21.svg" },
    { name: "Plaid", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Plaid_logo.svg" },
    { name: "Coinbase", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1a/Coinbase.svg" },
    { name: "Binance", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e8/Binance_Logo.svg" },
    { name: "Ethereum", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/Ethereum_logo_2014.svg" },
    { name: "Bitcoin", logo: "https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg" },
    { name: "Dropbox", logo: "https://www.vectorlogo.zone/logos/dropbox/dropbox-ar21.svg" },
    { name: "Box", logo: "https://www.vectorlogo.zone/logos/box/box-ar21.svg" },
    { name: "Atlassian", logo: "https://www.vectorlogo.zone/logos/atlassian/atlassian-ar21.svg" },
    { name: "Notion", logo: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" },
    { name: "Asana", logo: "https://www.vectorlogo.zone/logos/asana/asana-ar21.svg" },
    { name: "Monday.com", logo: "https://upload.wikimedia.org/wikipedia/commons/f/f4/Monday_logo.svg" },
    { name: "Lyft", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Lyft_logo.svg" },
    { name: "DoorDash", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fd/DoorDash_Logo.svg" },
    { name: "Instacart", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Instacart_logo_and_wordmark.svg" },
    { name: "Robinhood", logo: "https://upload.wikimedia.org/wikipedia/commons/9/90/Robinhood_Markets_logo.svg" },
    { name: "Wells Fargo", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Wells_Fargo_Bank.svg" },
    { name: "Chase", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e1/JPMorgan_Chase_Logo_2008.svg" },
    { name: "Bank of America", logo: "https://upload.wikimedia.org/wikipedia/commons/f/f4/Bank_of_America_logo.svg" },
    { name: "Citibank", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Citi.svg" }
  ];

  // Triple each array for infinite loop
  const repeatedRow1 = [...row1Logos, ...row1Logos, ...row1Logos];
  const repeatedRow2 = [...row2Logos, ...row2Logos, ...row2Logos, ...row2Logos, ...row2Logos, ...row2Logos];
  const repeatedRow3 = [...row3Logos, ...row3Logos, ...row3Logos, ...row3Logos, ...row3Logos, ...row3Logos];

  return (
    <div ref={containerRef} className="w-full max-w-7xl mx-auto px-4 py-16 relative" style={{ background: 'transparent', pointerEvents: 'auto' }}>
      <div className="text-center mb-12">
        {/* Title - Slide from left */}
        <motion.h2 
          initial={{ opacity: 0, x: -80 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-2xl md:text-3xl font-bold text-white mb-4"
        >
          Enterprise Engineering Excellence
        </motion.h2>
        
        {/* Subtitle - Slide from right */}
        <motion.p 
          initial={{ opacity: 0, x: 80 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-white/90 max-w-4xl mx-auto"
        >
          Engineered under the Triple-E Standard — enterprise best practices amplified and aligned with the same high-integrity benchmarks that leading global platforms refuse to compromise on.
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-1 relative overflow-hidden"
      >
        {/* Row 1: 107 logos - scroll left */}
        <div className="marquee-container">
          <div className="marquee-content marquee-row-1">
            {repeatedRow1.map((company, idx) => (
              <div key={`r1-${company.name}-${idx}`} className="logo-item">
                <img 
                  src={company.logo} 
                  alt={`${company.name} - Technology Partner Logo`}
                  className="logo-img"
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: 33 logos - scroll right */}
        <div className="marquee-container">
          <div className="marquee-content marquee-row-2">
            {repeatedRow2.map((company, idx) => (
              <div key={`r2-${company.name}-${idx}`} className="logo-item">
                <img 
                  src={company.logo} 
                  alt={`${company.name} - Technology Partner Logo`}
                  className="logo-img"
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: 32 logos - scroll left */}
        <div className="marquee-container">
          <div className="marquee-content marquee-row-3">
            {repeatedRow3.map((company, idx) => (
              <div key={`r3-${company.name}-${idx}`} className="logo-item">
                <img 
                  src={company.logo} 
                  alt={`${company.name} - Technology Partner Logo`}
                  className="logo-img"
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <style>{`
        .marquee-container {
          overflow: hidden;
          position: relative;
          width: 100%;
          padding: 0.75rem 0;
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }

        .marquee-content {
          display: flex;
          gap: 2rem;
          will-change: transform;
        }

        .marquee-row-1 {
          animation: marquee-left 120s linear infinite;
        }

        .marquee-row-2 {
          animation: marquee-right 90s linear infinite;
        }

        .marquee-row-3 {
          animation: marquee-left 100s linear infinite;
        }

        .marquee-container:hover .marquee-content {
          animation-play-state: paused;
        }

        .logo-item {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 120px;
          height: 60px;
          padding: 0.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .logo-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          filter: brightness(0) invert(1) opacity(0.7);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .logo-item:hover {
          transform: scale(1.15) translateY(-2px);
          z-index: 10;
        }

        .logo-item:hover .logo-img {
          filter: brightness(1) invert(0) opacity(1);
          drop-shadow: 0 0 20px rgba(87, 61, 255, 0.8));
        }

        @keyframes marquee-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        @keyframes marquee-right {
          0% {
            transform: translateX(-33.333%);
          }
          100% {
            transform: translateX(0);
          }
        }

        .marquee-container:nth-child(1) {
          transform: translateY(-2px);
        }

        .marquee-container:nth-child(2) {
          transform: translateY(2px);
        }

        .marquee-container:nth-child(3) {
          transform: translateY(-2px);
        }

        @keyframes scan {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.3;
          }
        }

        .marquee-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(87, 61, 255, 0.15), transparent);
          animation: scan 4s linear infinite;
        }
      `}</style>
    </div>
  );
}