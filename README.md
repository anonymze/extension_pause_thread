# PAUSE ANY WEBSITE

	"//": "content is the script that runs on web pages, can modify DOM, has limited access to extension API (see it like the hands)",
	"content_scripts": [
		{
			"matches": ["*://*/*"],
			"js": ["hands.js"],
			"run_at": "document_start"
		}
	],

	"///": "background is the process script that runs when the extension is installed / active, has access to extension API, runs all the time (see it like the brain)",

		"action": {
		"//": "default_popup param is the UI of the extension, it is displayed when the extension is clicked",