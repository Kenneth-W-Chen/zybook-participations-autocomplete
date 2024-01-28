# About

A userscript to automatically complete participation activities on zyBooks. This script creates a button on the toolbar at the top. Pressing the button will complete the participation activities on the current page.

This script can't complete some of the new drag and drop activities. Some of them require you to place the blocks and press the check button to see if the answer is right. The check can take 1-3 seconds, and there can be at least 6 blocks to order properly. tl;dr: unless you want to wait 6! seconds, it's better to do those manually.

# Requirements

* A webbrowser that can run extensions or userscripts and JavaScript
* Screen should be large enough that buttons are visible. This is because the SB questions page hides certain buttons we need if the page is too small.
* A userscript manager (script tested with [ViolentMonkey](https://violentmonkey.github.io/) 2.18.0)
* Basic common sense

# Usage

Add the script to your userscript manager. Turn on the script and navigate to the SmartBook assignment's question page. That's it.

# To-do

* Add a modal that appears below the button if there is a participation activity that can't be automatically completed (i.e., the new drag and drop activities; potentially activities that require the user to code).
* Kill the button event handler if the page changes. There might be a bug if the user navigates to a different page while the handler is running
* Make a minified version?
