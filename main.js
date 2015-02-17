define(function (require, exports, module) {
    "use strict";

    //brackets modules
    var AppInit = brackets.getModule("utils/AppInit"),
        CommandManager = brackets.getModule("command/CommandManager"),
        Dialogs = brackets.getModule("widgets/Dialogs"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        FileUtils = brackets.getModule("file/FileUtils"),
        KeyBindingManager = brackets.getModule('command/KeyBindingManager'),
        Menus = brackets.getModule("command/Menus"),
        PanelManager = brackets.getModule("view/PanelManager");

    //templates
    var tokenDialogTemplate = require("text!./templates/token-dialog.html"),
        pushDialogTemplate = require("text!./templates/push-dialog.html");

    var dataDir = brackets.app.getUserDocumentsDirectory() + '/Pushbullet for Brackets/';
    var accessTokenFile, userDataFile;
    accessTokenFile = dataDir + 'accessToken';
    userDataFile = dataDir + 'me';
    var userData;

    var tokenDialog, pushDialog;

    ExtensionUtils.loadStyleSheet(module, "styles/style.css");

    function checkForAccessToken() {
        var dir = FileSystem.getDirectoryForPath(dataDir);
        console.log('dir', dir);
        dir.create();
        accessTokenFile = FileSystem.getFileForPath(accessTokenFile);
        console.log("userDataFile", userDataFile);
        var readAccessToken = FileUtils.readAsText(accessTokenFile);
        readAccessToken.done(function (accessToken) {
                console.log("accessTokenFile read succesfully", accessToken);
                showPushDialog();
            })
            .fail(function (error) {
                console.log("Error in reading accessTokenFile", error);
                if (error == "NotFound") {
                    showAccessTokenDialog();
                }
            });
    }

    function showAccessTokenDialog() {
        tokenDialog = Dialogs.showModalDialogUsingTemplate($(tokenDialogTemplate));
        var $tokenDialog = tokenDialog.getElement();
        $tokenDialog.on("click", "#pfb-token-save", function () {
            var accessTokenInput = $("#pfb-accessTokenInput").val();
            console.log("Save token clicked", accessTokenInput);
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://api.pushbullet.com/v2/users/me", false);
            xhr.setRequestHeader("Authorization", "Bearer " + accessTokenInput);
            xhr.onreadystatechange = function () {
                console.log(xhr.response);
                userDataFile = FileSystem.getFileForPath(userDataFile);
                var writeUserData = FileUtils.writeText(userDataFile, xhr.response);
                writeUserData.done(function () {
                    var writeAccessToken = FileUtils.writeText(accessTokenFile, accessTokenInput);
                    writeAccessToken.done(function () {
                        tokenDialog.close();
                        showPushDialog();
                    });
                }).fail(function (error) {
                    console.log("Failed to save access token to file", error);
                });
            };
            xhr.send();
        });
    }

    function showPushDialog() {
        pushDialog = Dialogs.showModalDialogUsingTemplate($(pushDialogTemplate));
    }

    // Function to run when the menu item is clicked
    function handle() {
        console.log("Pressed Ctrl Shift P");
        checkForAccessToken();
    }

    AppInit.appReady(function () {

        // First, register a command - a UI-less object associating an id to a handler
        var MY_COMMAND_ID = "technicosa.pushbullet"; // package-style naming to avoid collisions
        CommandManager.register("Pushbullet for Brackets", MY_COMMAND_ID, handle);

        // Then create a menu item bound to the command
        // The label of the menu item is the name we gave the command (see above)
        var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
        menu.addMenuItem(MY_COMMAND_ID);

        KeyBindingManager.addBinding(MY_COMMAND_ID, "Ctrl-Shift-P");
    });



});