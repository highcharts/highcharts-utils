/**
 * This file is bundled into edit.bundle.js on server start and restart
 */
import { EditorView, basicSetup } from "codemirror";
import { Prec } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { linter, lintGutter } from "@codemirror/lint";
import { indentMore, indentLess } from "@codemirror/next/commands";
import { indentUnit as nextIndentUnit } from "@codemirror/next/language";

import { indentUnit } from "@codemirror/language";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript, esLint } from "@codemirror/lang-javascript";
import { markdown } from "@codemirror/lang-markdown";
import { yaml } from "@codemirror/lang-yaml";

// Uses linter.mjs
import * as eslint from "eslint-linter-browserify";

// Set the default indent unit for Tab and Shift-Tab
nextIndentUnit.default = '    ';

const run = () => {
	document.getElementById("files-form").submit();
	return true;
}

const save = () => {
	const activeTabButton = document.querySelector('.tab-button.active'),
		fileName = activeTabButton.textContent,
		editor = editors.find(e => e.id === fileName);

	// Set the save input to the file name
	document.getElementById("save-input").value = fileName;
	document.getElementById("files-form").submit();

	document.getElementById("save-input").value = 'false';
	activeTabButton.classList.remove('changed');
	editor.savedValue = editor.state.doc.toString();
}

const saveAs = () => {
	document.getElementById('save-as-dialog').style.display = 'flex';
	// Set the focus to the end of the text within the input
	document.getElementById('save-as-input').focus();
	document.getElementById('save-as-input').setSelectionRange(
		document.getElementById('save-as-input').value.length,
		document.getElementById('save-as-input').value.length
	);
}

const saveAsCancel = (e) => {
	document.getElementById('save-as-dialog').style.display = 'none';
	document.getElementById('save-as-hidden-input').value = '';
	e.preventDefault();
}

const saveAsInputOnKeyUp = (e) => {
	const input = e.target,
		regex = window.validPathRegex;

	if (regex.test(input.value)) {
		input.classList.remove('invalid');
		document.getElementById('save-as-submit').disabled = false;
	} else {
		input.classList.add('invalid');
		document.getElementById('save-as-submit').disabled = true;
	}
}

const saveAsSubmit = (e) => {
	e.preventDefault();
	const input = document.getElementById('save-as-input'),
		hiddenInput = document.getElementById('save-as-hidden-input');

	hiddenInput.value = input.value;
	document.getElementById('files-form').submit();
}

const exitEdit = () => {
	window.parent.controller.frames().main.contentDocument
		.getElementById('edit')
		.click();
}

const esLintConfig = {
	// eslint configuration
	languageOptions: {
		globals: {
				// ...globals.node,
		},
		parserOptions: {
			ecmaVersion: 2020
		}
	},
	rules: {
		indent: [2, 4],
		'max-len': [
			"error",
			{
				"ignorePattern": "(data:image/)",
				"ignoreUrls": true
			}
		],
		'object-curly-spacing': [2, "always"],
		quotes: [2, "single"]

	},
};

const editors = [];
document.addEventListener("DOMContentLoaded", () => {

	document.getElementById('error-message').remove();

	// Initialize CodeMirror
	[].forEach.call(
		document.querySelectorAll('textarea.file-content'),
		(textarea) => {
			const fileName = textarea.name,
				tabButton = document.getElementById(`tab-button-${fileName}`),
				ext = fileName.split('.').pop(),
				lang = {
					js: javascript(),
					css: css(),
					details: yaml(),
					html: html(),
					md: markdown()
				}[ext];

            const updateListenerExtension = EditorView.updateListener.of(
				(update) => {
					if (update.docChanged) {
						textarea.value = editor.state.doc.toString();
						if (editor.state.doc.toString() === editor.savedValue) {
							tabButton.classList.remove('changed');
						} else {
							tabButton.classList.add('changed');
						}
					}
				}
			);

            const editor = new EditorView({
                doc: textarea.value,
                indentUnit: '    ',
                readOnly: false,
                extensions: [
                    basicSetup,
                    lang,
                    indentUnit.of('    '),
                    updateListenerExtension,
					lintGutter(),
					linter(esLint(new eslint.Linter(), esLintConfig)),
                    Prec.highest(keymap.of([
                        {
                            key: 'Ctrl-Enter',
                            run,
                            preventDefault: true
                        },
                        {
                            key: 'Ctrl-s',
                            run: save,
                            preventDefault: true
                        },
                        {
                            key: 'Ctrl-e',
                            run: exitEdit,
                            preventDefault: true
                        },
                        {
                            key: 'Cmd-Enter',
                            run: run,
                            preventDefault: true
                        },
                        {
                            key: 'Cmd-s',
                            run: save,
                            preventDefault: true
                        },
						{
                            key: 'Cmd-e',
                            run: exitEdit,
                            preventDefault: true
                        },
                        {
							key: "Tab",
							preventDefault: true,
							run: indentMore,
						  },
						  {
							key: "Shift-Tab",
							preventDefault: true,
							run: indentLess,
						  }
                    ]))
                ].filter(Boolean)
            });

            textarea.parentNode.insertBefore(editor.dom, textarea);
            textarea.style.display = "none";
            if (textarea.form) {
                textarea.form.addEventListener("submit", () => {
                    textarea.value = editor.state.doc.toString();
                });
            }

            editor.id = fileName;
			editor.savedValue = editor.state.doc.toString();

			editors.push(editor);
		}
	);

	// Tab functionality
  	const tabButtons = document.querySelectorAll(".tab-button"),
  		tabContents = document.querySelectorAll(".tab-content");

	const setActiveTab = (i) => {
    	tabButtons[i].classList.add("active");
    	tabContents[i].classList.add("active");

		// Edit in VSCode
		const fileName = tabButtons[i].textContent,
			editInVSCodeAnchor = document.getElementById('edit-in-vscode');

		editInVSCodeAnchor.href =
			`vscode://file/${editInVSCodeAnchor.dataset.fullPath}/${fileName}`;
		editInVSCodeAnchor.title = `Edit ${fileName} in VSCode`;
	}

  	tabButtons.forEach((button, i) => {
    	button.addEventListener("click", () => {
      		tabButtons.forEach((btn) => btn.classList.remove("active"));
      		tabContents.forEach((content) => content.classList.remove("active"));

      		setActiveTab(i);
    	});
  	});

  	// Activate the first tab by default
  	if (tabButtons.length > 0 && tabContents.length > 0) {
    	setActiveTab(0);
  	}

	// Activate the buttons
	document.getElementById("run-button").addEventListener("click", run);
	document.getElementById("save-button").addEventListener("click", save);
	document.getElementById("save-as-button").addEventListener("click", saveAs);
	document.getElementById("save-as-cancel").addEventListener("click", saveAsCancel);
	document.getElementById("save-as-input").addEventListener("keyup", saveAsInputOnKeyUp);
	document.getElementById("save-as-form").addEventListener("submit", saveAsSubmit);
});