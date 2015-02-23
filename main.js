define(function (require, exports, module) {
    "use strict";

    //brackets modules
    var AppInit = brackets.getModule("utils/AppInit"),
        CommandManager = brackets.getModule("command/CommandManager"),
        Dialogs = brackets.getModule("widgets/Dialogs"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        FileUtils = brackets.getModule("file/FileUtils"),
        KeyBindingManager = brackets.getModule('command/KeyBindingManager'),
        Menus = brackets.getModule("command/Menus"),
        PanelManager = brackets.getModule("view/PanelManager"),
        launcher = brackets.getModule("LiveDevelopment/MultiBrowserImpl/launchers/Launcher");

    //templates
    var tokenDialogTemplate = require("text!./templates/token-dialog.html"),
        pushDialogTemplate = require("text!./templates/push-dialog.html");

    //data files
    var dataDir = brackets.app.getUserDocumentsDirectory() + '/Pushbullet for Brackets/';
    var accessTokenFile = dataDir + 'accessToken',
        userDataFile = dataDir + 'me',
        contactsFile = dataDir + 'contacts';
    accessTokenFile = FileSystem.getFileForPath(accessTokenFile);
    userDataFile = FileSystem.getFileForPath(userDataFile);
    contactsFile = FileSystem.getFileForPath(contactsFile);

    //data 
    var userData, accessToken, contacts;

    //dialogs
    var tokenDialog, pushDialog;

    ExtensionUtils.loadStyleSheet(module, "styles/style.css");

    /*
     * read access token from file
     * if exists, show push dialog
     * else show access token dialog
     */
    function checkForAccessToken(openPush) {
        var dir = FileSystem.getDirectoryForPath(dataDir);
        console.log('dir', dir);
        dir.create();
        console.log("userDataFile", userDataFile);
        var readAccessToken = FileUtils.readAsText(accessTokenFile);
        readAccessToken.done(function (token) {
                console.log("accessTokenFile read succesfully", token);
                accessToken = token;
                if (openPush) showPushDialog();
                else syncContacts();
            })
            .fail(function (error) {
                console.log("Error in reading accessTokenFile", error);
                if (error == "NotFound") {
                    showAccessTokenDialog(openPush);
                }
            });
    }

    function syncContacts(openPush) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://api.pushbullet.com/v2/contacts", false);
        xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    contacts = JSON.parse(xhr.response).contacts;
                    console.log("received contacts", contacts);
                    //                var writeContacts = FileUtils.writeText(contactsFile, JSON.stringify(contacts));
                    //                writeContacts.done(function () {
                    //                    console.log("contact sync complete");
                    //                }).fail(function (error) {
                    //                    console.log("contact write to file", error);
                    //                });
                    if (openPush) showPushDialog();
                } else {
                    console.log("contact sync failed", xhr);
                }
                $(".pfb-dialog-body__loader__bg").hide();
            }
        };
        xhr.send();
    }

    /*
     * take access token input
     * on save, GET user data
     * GET success: save user data and show push dialog
     * GET error: show error message
     */
    function showAccessTokenDialog(openPush) {
        tokenDialog = Dialogs.showModalDialogUsingTemplate($(tokenDialogTemplate));
        $(".pfb-dialog-body__loader__bg").hide();
        $("#pfb-token-invalidToken").hide();
        var $tokenDialog = tokenDialog.getElement();
        $tokenDialog.on("click", "#pfb-token-save", function () {
            $("#pfb-token-invalidToken").hide();
            $(".pfb-dialog-body__loader__bg").show();
            var accessTokenInput = $("#pfb-token-accessTokenInput").val();
            console.log("Save token clicked", accessTokenInput);
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://api.pushbullet.com/v2/users/me", false);
            xhr.setRequestHeader("Authorization", "Bearer " + accessTokenInput);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    accessToken = accessTokenInput;
                    console.log(xhr.response);
                    userData = xhr.response;
                    //                    var writeUserData = FileUtils.writeText(userDataFile, xhr.response);
                    //                    writeUserData.done(function () {
                    var writeAccessToken = FileUtils.writeText(accessTokenFile, accessTokenInput);
                    writeAccessToken.done(function () {
                            tokenDialog.close();
                            syncContacts(openPush);
                        })
                        .fail(function (error) {
                            console.log("Failed to save access token to file", error);
                        });

                } else {
                    console.log("invalid access token");
                    $(".pfb-dialog-body__loader__bg").hide();
                    $("#pfb-token-invalidToken").show();
                }
            };
            xhr.send();
        });
    }

    function showPushDialog() {
        pushDialog = Dialogs.showModalDialogUsingTemplate($(pushDialogTemplate));
        var listItems = "";
        for (var i = 0; i < contacts.length; i++) {
            listItems += "<option value='" + contacts[i].email + "'>" + contacts[i].name + "</option>";
        }
        $("#pfb-push-to").html(listItems);
         var editor = EditorManager.getActiveEditor();
        var selectedText = '';
        if(editor && editor.getSelectedText().length>0)
            selectedText = editor.getSelectedText();
        else selectedText = "Nothing selected";
        $('#pfb-push-textarea').val(selectedText);
            console.log("editor",selectedText)
        var $pushDialog = pushDialog.getElement();
        $pushDialog.on("click", "#pfb-push-push", function () {
            var postObject = {
                "type": "note",
                "title": "",
                "body": ""
            };
            postObject.title = $("#pfb-push-title").val();
            postObject.body = $("#pfb-push-textarea").val();
            var toEmail = $("#pfb-push-to").val();
            
            pushDialog.close();
            console.log("toEmail", toEmail);
            postObject.email = toEmail;
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "https://api.pushbullet.com/v2/pushes", false);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    console.log(xhr.response);
                }
            }
            console.log("postObject", postObject);
            xhr.send(JSON.stringify(postObject));
        });
    }


    // Function to run when the menu item is clicked or shortcut is used
    function handle() {
        console.log("Pressed Ctrl Shift P");
        //        launcher.launch("http://www.google.com");
        checkForAccessToken(true);
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
        $("<a href='#' id='pbf-toolbar-icon' title='Pushbullet for Brackets!'></a>").appendTo("#main-toolbar div.buttons").on("click", handle);
        checkForAccessToken(false);
    });


});