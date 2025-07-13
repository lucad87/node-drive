function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user && req.user.canAccess) {
            return next();
        } else {
            return res.redirect('/pending.html');
        }
    }
    res.redirect('/login.html');
}

function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user && req.user.isAdmin) {
        return next();
    }
    res.redirect('/forbidden.html');
}

module.exports = { isAuthenticated, isAdmin };