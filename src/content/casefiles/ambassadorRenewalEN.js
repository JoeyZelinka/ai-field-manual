// src/content/casefiles/ambassadorRenewalEN.js

const ambassadorRenewalEN = {
  id: "ambassador-renewal-en",
  language: "EN",
  // NOTE: webviews don’t reliably expose the original inbox subject line,
  // so we use the on-page headline structure as the seed.
  subject: "You’ve Renewed Your Ambassador Elite Status",
  preheader: "Continue to enjoy your Elite benefits.",
  hero: "Congratulations, [Fname]! You’ve Renewed Your Ambassador Elite Status.",
  expiry: "2027-02-28",
  benefits: [
    "Ambassador Service",
    "Enhanced Room Upgrades",
    "Your24™ Flexibility",
  ],
  primaryCta: "Explore Benefits",
  secondary: {
    prefs: {
      headline:
        "Personalize your travel preferences so your personal Ambassador can learn more about you and your travel style.",
      cta: "Update Your Preferences",
    },
  },
  modules: [
    {
      headline: "One-to-One Connection",
      blurb:
        "Leave it all to your personal Ambassador. Enjoy exceptional travel near and far with tailor-made touches everywhere you go.",
      cta: "Learn More",
    },
    {
      headline: "24/7 Assistance",
      blurb:
        "Our Anytime Ambassador team works alongside your personal Ambassador for time-sensitive requests.",
      cta: "Learn More",
    },
  ],
};

export default ambassadorRenewalEN;