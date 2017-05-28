/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode_1 = require("vscode");
function activate(context) {
    var status = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, 100);
    status.command = 'extension.searchLuaFun';
    status.text = '$(search)' + "搜索Lua函数";
    status.show();
    context.subscriptions.push(status);
    var statusTime = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left, 300);
    statusTime.show();
    context.subscriptions.push(statusTime);
    // context.subscriptions.push(window.onDidChangeActiveTextEditor(e => updateStatus(status)));
    // context.subscriptions.push(window.onDidChangeTextEditorSelection(e => updateStatus(status)));
    // context.subscriptions.push(window.onDidChangeTextEditorViewColumn(e => updateStatus(status)));
    // context.subscriptions.push(workspace.onDidOpenTextDocument(e => updateStatus(status)));
    // context.subscriptions.push(workspace.onDidCloseTextDocument(e => updateStatus(status)));
    var curDate = new Date();
    curDate.setSeconds(0);
    statusTime.text = getRunTotalTime(curDate);
    setInterval(function () {
        var t = new Date();
        statusTime.text = getRunTotalTime(curDate);
    }, 1000);
    context.subscriptions.push(vscode_1.commands.registerCommand('extension.searchLuaFun', function () {
        if (vscode_1.window.activeTextEditor) {
            var funList = getLuaFunctionList();
            if (funList) {
                var funMap = getLuaFunctionLine(funList);
                vscode_1.window.showQuickPick(funList).then(function (selected) {
                    if (selected) {
                        if (funMap.has(selected)) {
                            var it = funMap.get(selected);
                            goToLine(it);
                        }
                    }
                });
            }
        }
        //
    }));
    //updateStatus(status);
}
exports.activate = activate;
function getLuaFunctionList() {
    var re = vscode_1.window.activeTextEditor.document.getText();
    return re.match(/function .*(\w*)/g);
}
function getLuaFunctionLine(list) {
    //  把内容  split \n
    //  for 循环寻找 此函数 找到就是这个行数.
    var content = vscode_1.window.activeTextEditor.document.getText().split("\n");
    var retMap = new Map();
    list.forEach(function (itor) {
        var index = findVecIndex(content, itor.trim());
        if (index != -1) {
            retMap.set(itor.trim(), index);
        }
    });
    return retMap;
}
function findVecIndex(params, data) {
    for (var index = 0; index < params.length; index++) {
        var element = params[index].trim();
        if (element.indexOf(data) >= 0) {
            return index + 1;
        }
    }
    return -1;
}
function goToLine(params) {
    vscode_1.window.activeTextEditor.selection = new vscode_1.Selection(new vscode_1.Position(params - 1, 0), new vscode_1.Position(params - 1, 0));
    vscode_1.window.activeTextEditor.revealRange(vscode_1.window.activeTextEditor.selection, vscode_1.TextEditorRevealType.InCenter);
}
function getRunTotalTime(oldTime) {
    var t = new Date();
    var retTime = "";
    var hours = (t.getHours() - oldTime.getHours());
    var minutes = (t.getMinutes() - oldTime.getMinutes());
    var seconds = (t.getSeconds() - oldTime.getSeconds());
    retTime += "$(clock)当前已运行:";
    if (hours > 0) {
        retTime += hours + "小时";
    }
    if (minutes > 0) {
        retTime += minutes + "分钟";
    }
    if (seconds > 0) {
        retTime += seconds + "秒";
    }
    return retTime;
}
function updateStatus(status) {
    var text = getSelectedLines();
    if (text) {
        status.text = '$(search) ' + text;
    }
    if (text) {
        status.show();
    }
    else {
        status.hide();
    }
}
function getSelectedLines() {
    var editor = vscode_1.window.activeTextEditor;
    var text;
    if (editor) {
        var lines_1 = 0;
        editor.selections.forEach(function (selection) {
            lines_1 += (selection.end.line - selection.start.line + 1);
        });
        if (lines_1 > 0) {
            text = lines_1 + " line(s) selected";
        }
    }
    return text;
}
//# sourceMappingURL=extension.js.map