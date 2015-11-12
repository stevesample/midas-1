/**
* Only Admins should be able to UPDATE the isAdmin property of the model.
* All other references to isAdmin should be scrubbed.
*/
module.exports = function protectAdmin (req, res, next) {
  if ( !(req.user && req.user[0].isAdmin) ) {
    delete req.body.isAdmin;
  }
  next();
};
