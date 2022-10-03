const adminRouter = require("express").Router();
const userRouter = require("express").Router();
const handlers = require("./controller");


// admin router
adminRouter.post("/roles", handlers.createRoles);
adminRouter.post("/user/new", handlers.createUser);
adminRouter.post("/user/assign", handlers.editUserRoles);
adminRouter.get("/roles", handlers.getRoles);
adminRouter.post("/roles/scopes", handlers.updateScopes);

// user router common to admin router
userRouter.post("/authorize", handlers.getAccessToken);
userRouter.get("/me", handlers.getDetails);
userRouter.post("/password", handlers.changePassword);

module.exports = {adminRouter, userRouter};