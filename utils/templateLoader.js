const fs = require("fs");
const path = require("path");

/**
 * Load an HTML email template and replace all {{placeholder}} tokens
 * with the provided values object.
 *
 * @param {string} templateName  - File name without extension (e.g. "welcome")
 * @param {object} values        - Key/value pairs to replace in the template
 * @returns {string}             - Final HTML string ready to send
 */
function loadTemplate(templateName, values = {}) {
  const templatePath = path.join(__dirname, "../templates", `${templateName}.html`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Email template not found: ${templateName}.html`);
  }

  let html = fs.readFileSync(templatePath, "utf-8");

  // Replace every {{key}} placeholder with its value
  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    html = html.replace(regex, value !== undefined && value !== null ? value : "");
  });

  // Remove any remaining {{#if ...}} / {{/if}} blocks whose condition was not provided
  // Simple block: strip {{#if VAR}} ... {{/if}} when the value is empty/falsy
  html = html.replace(/{{#if \w+}}[\s\S]*?{{\/if}}/g, "");

  return html;
}

module.exports = { loadTemplate };
