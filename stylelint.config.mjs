/** @type {import("stylelint").Config} */
export default {
  customSyntax: "postcss-scss",
  plugins: ["stylelint-use-logical"],
  ignoreFiles: ["dist/**", "doc/compodoc/**", "coverage/**"],
  rules: {
    // Require logical properties for the horizontal axis (margin-inline-start instead of margin-left,
    // text-align: start instead of left, ...), so the layout mirrors for right-to-left languages.
    // Vertical and size properties are physical in every writing mode we support, so they are allowed.
    "csstools/use-logical": [
      "always",
      {
        except: [
          /^(top|bottom)$/,
          /^(margin|padding)-(top|bottom)$/,
          /^border-(top|bottom)(-(color|style|width))?$/,
          /^(min-|max-)?(width|height)$/,
        ],
      },
    ],
  },
};
