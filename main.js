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
    var tokenDialogTemplate = require('text!./templates/token-dialog.html');

    var userDataFile;
    var userData;
    
    var tokenDialog;

    ExtensionUtils.loadStyleSheet(module, "styles/style.css");

    function checkForAccessToken() {
        var dir = brackets.app.getUserDocumentsDirectory() + '/Pushbullet for Brackets/';
        userDataFile = dir + 'userData.json';
        dir = FileSystem.getDirectoryForPath(dir);
        console.log('dir', dir);
        dir.create();
        userDataFile = FileSystem.getFileForPath(userDataFile);
        console.log("userDataFile", userDataFile);
        var readAccessToken = FileUtils.readAsText(userDataFile);
        readAccessToken.done(function (userData) {
                console.log("accessToken read succesfully", userData);
            })
            .fail(function (error) {
                console.log("Error in reading userDataFile", error);
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
            tokenDialog.close();
            var xhr = new XMLHttpRequest()
                //            xhr.open("GET", "https://api.pushbullet.com/v2/users/me", false)
                //            xhr.setRequestHeader("Authorization", "Bearer <your_access_token_here>")
                //            xhr.send()
                //            console.log(xhr)
            var write = FileUtils.writeText(userDataFile, '{"name": "user"}');
            write.fail(function (error) {
                alert("Failed to save access token to file", error);
            });
        });
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