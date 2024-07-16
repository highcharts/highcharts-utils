/**
 * Bundle this file with the following command:
 *
 * npx rollup -c
 */
import { EditorView, basicSetup } from "codemirror";
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
}

const save = () => {
	const activeTabButton = document.querySelector('.tab-button.active'),
		fileName = activeTabButton.textContent,
		editor = editors.find(e => e.id === fileName);

	// Set the save input to the file name
	document.getElementById("save-input").value = fileName;
	document.getElementById("files-form").submit();

	activeTabButton.classList.remove('changed');
	editor.savedValue = editor.state.doc.toString();
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
                /*
			const editor = CodeMirror.fromTextArea(textarea, {
				id: fileName,
				mode,
				indentUnit: '    ',
				lineNumbers: true,
				readOnly: false
			});*/

            const updateListenerExtension = EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    textarea.value = editor.state.doc.toString();
                    if (editor.state.doc.toString() === editor.savedValue) {
                        tabButton.classList.remove('changed');
                    } else {
                        tabButton.classList.add('changed');
                    }
                }
            });

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
                    keymap.of([
                        {
                            key: 'Ctrl-Enter',
                            run: run,
                            preventDefault: true
                        },
                        {
                            key: 'Ctrl-s',
                            run: save,
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
							key: "Tab",
							preventDefault: true,
							run: indentMore,
						  },
						  {
							key: "Shift-Tab",
							preventDefault: true,
							run: indentLess,
						  }
                    ])
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

/*

            editor.on('keydown', (cm, event) => {
				if (
					event.key === 'Enter' &&
					(event.ctrlKey || event.metaKey)
				) {
					run();
				}

				if (
					event.key === 's' &&
					(event.ctrlKey || event.metaKey)
				) {
					save();
					event.preventDefault();
				}
			});
*/
			editors.push(editor);
		}
	);

	// Tab functionality
  	const tabButtons = document.querySelectorAll(".tab-button");
  	const tabContents = document.querySelectorAll(".tab-content");

  	tabButtons.forEach((button) => {
    	button.addEventListener("click", () => {
      		const targetTab = button.getAttribute("data-tab");

      		tabButtons.forEach((btn) => btn.classList.remove("active"));
      		tabContents.forEach((content) => content.classList.remove("active"));

      		button.classList.add("active");
      		document.getElementById(targetTab)?.classList.add("active");
			// editors.forEach(editor => editor.refresh());
    	});
  	});

  	// Activate the first tab by default
  	if (tabButtons.length > 0 && tabContents.length > 0) {
    	tabButtons[0].classList.add("active");
    	tabContents[0].classList.add("active");
		// editors[0].refresh();
  	}

	// Activate the buttons
	document.getElementById("run-button").addEventListener("click", run);
	document.getElementById("save-button").addEventListener("click", save);
});