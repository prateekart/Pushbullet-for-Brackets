define(function (require, exports, module) {
    "use strict";

    var AppInit = brackets.getModule("utils/AppInit"),
        CommandManager = brackets.getModule("command/CommandManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        KeyBindingManager = brackets.getModule('command/KeyBindingManager'),
        Menus = brackets.getModule("command/Menus"),
        PanelManager = brackets.getModule("view/PanelManager");

    // Function to run when the menu item is clicked
    function handle() {
        console.log("Pressed Ctrl Shift P");
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