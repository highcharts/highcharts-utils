/* global CodeMirror */
const run = () => {
	document.getElementById("files-form").submit();
}

const save = () => {
	const activeTabButton = document.querySelector('.tab-button.active'),
		fileName = activeTabButton.textContent,
		editor = editors.find(e => e.options.id === fileName);

	// Set the save input to the file name
	document.getElementById("save-input").value = fileName;
	document.getElementById("files-form").submit();

	activeTabButton.classList.remove('changed');
	editor.savedValue = editor.getValue();
}

const editors = [];
document.addEventListener("DOMContentLoaded", () => {

	// Initialize CodeMirror
	[].forEach.call(
		document.querySelectorAll('textarea.file-content'),
		(textarea) => {
			const fileName = textarea.name,
				tabButton = document.getElementById(`tab-button-${fileName}`),
				ext = fileName.split('.').pop(),
				mode = {
					js: 'javascript',
					css: 'css',
					details: 'yaml',
					html: 'htmlmixed',
					md: 'markdown'
				}[ext] || ext
			const editor = CodeMirror.fromTextArea(textarea, {
				id: fileName,
				mode,
				indentUnit: '    ',
				lineNumbers: true,
				readOnly: false
			});
			editor.savedValue = editor.getValue();

			// Add a change event listener
			editor.on('change', () => {
				// Update the textarea value with the editor content
				textarea.value = editor.getValue();
				if (editor.getValue() === editor.savedValue) {
					tabButton.classList.remove('changed');
				} else {
					tabButton.classList.add('changed');
				}
			});

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
			editors.forEach(editor => editor.refresh());
    	});
  	});

  	// Activate the first tab by default
  	if (tabButtons.length > 0 && tabContents.length > 0) {
    	tabButtons[0].classList.add("active");
    	tabContents[0].classList.add("active");
		editors[0].refresh();
  	}

	// Activate the buttons
	document.getElementById("run-button").addEventListener("click", run);
	document.getElementById("save-button").addEventListener("click", save);
});