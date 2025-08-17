const User = require("../models/user.js");

module.exports.register = (req, res) => {
    res.render("./users/register.ejs");
}

module.exports.postRegister = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = new User({ username, email });
        const registeredUser = await User.register(user, password);

        // Auto login after registration/signup
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to BnBharat!");
            res.redirect("/listings");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/register");
    }
}

module.exports.loginPage = (req, res) => {
    res.render("./users/login.ejs");
}

module.exports.postLogin = (req, res) => {
        req.flash("success", "Welcome back!");
        const redirectUrl = req.session.redirectUrl || "/listings";
        delete req.session.redirectUrl; // cleanup
        res.redirect(redirectUrl);
}

module.exports.googleCallback = (req, res) => {
    req.flash("success", `Welcome, ${req.user.username}`);
    res.redirect("/listings");
  }

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "You have been logged out!");
        res.redirect("/listings");
    });
}

// Footer page handlers
module.exports.privacyPage = (req, res) => {
    res.render("./users/privacy.ejs");
}

module.exports.termsPage = (req, res) => {
    res.render("./users/terms.ejs");
}

module.exports.companyDetailsPage = (req, res) => {
    res.render("./users/details.ejs");
}

module.exports.sitemapPage = (req, res) => {
    res.render("./users/sitemap.ejs");
}

// Support pages
module.exports.helpCenterPage = (req, res) => {
    res.render("./users/help-center.ejs");
}

module.exports.safetyPage = (req, res) => {
    res.render("./users/safety.ejs");
}

module.exports.cancellationPage = (req, res) => {
    res.render("./users/cancellation.ejs");
}

module.exports.covidResponsePage = (req, res) => {
    res.render("./users/covid-response.ejs");
}

module.exports.disabilityPage = (req, res) => {
    res.render("./users/disability-support.ejs");
}

// Hosting pages
module.exports.tryHostingPage = (req, res) => {
    res.render("./users/try-hosting.ejs");
}

module.exports.airCoverPage = (req, res) => {
    res.render("./users/aircover.ejs");
}

module.exports.hostingResourcesPage = (req, res) => {
    res.render("./users/hosting-resources.ejs");
}

module.exports.communityForumPage = (req, res) => {
    res.render("./users/community-forum.ejs");
}

module.exports.responsibleHostingPage = (req, res) => {
    res.render("./users/responsible-hosting.ejs");
}

// BnBharat pages
module.exports.newsroomPage = (req, res) => {
    res.render("./users/newsroom.ejs");
}

module.exports.newFeaturesPage = (req, res) => {
    res.render("./users/new-features.ejs");
}

module.exports.foundersLetterPage = (req, res) => {
    res.render("./users/founders-letter.ejs");
}

module.exports.careersPage = (req, res) => {
    res.render("./users/careers.ejs");
}

module.exports.investorsPage = (req, res) => {
    res.render("./users/investors.ejs");
}