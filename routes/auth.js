const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user.js");
const {saveRedirectUrl} = require("../middleware.js");

const authController = require("../controllers/auths.js");

router.route("/register")
.get(authController.register)
.post(authController.postRegister);

router.route("/login")
.get(authController.loginPage)
.post(saveRedirectUrl,
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true
    }),
    authController.postLogin
);

// ======================
// Google login route
// ======================
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// ======================
// Google callback route
// ======================
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  authController.googleCallback
);

// ======================
// Logout
// ======================
router.get("/logout", authController.logout);

// ======================
// Footer pages
// ======================
router.get("/privacy", authController.privacyPage);
router.get("/terms", authController.termsPage);
router.get("/details", authController.companyDetailsPage);
router.get("/sitemap", authController.sitemapPage);

// Support pages
router.get("/help-center", authController.helpCenterPage);
router.get("/safety", authController.safetyPage);
router.get("/cancellation", authController.cancellationPage);
router.get("/covid-response", authController.covidResponsePage);
router.get("/disability-support", authController.disabilityPage);

// Hosting pages
router.get("/try-hosting", authController.tryHostingPage);
router.get("/aircover", authController.airCoverPage);
router.get("/hosting-resources", authController.hostingResourcesPage);
router.get("/community-forum", authController.communityForumPage);
router.get("/responsible-hosting", authController.responsibleHostingPage);

// BnBharat pages
router.get("/newsroom", authController.newsroomPage);
router.get("/new-features", authController.newFeaturesPage);
router.get("/founders-letter", authController.foundersLetterPage);
router.get("/careers", authController.careersPage);
router.get("/investors", authController.investorsPage);

module.exports = router;
