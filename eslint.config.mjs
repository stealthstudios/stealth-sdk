import globals from "globals";
import js from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
    { languageOptions: { globals: globals.node } },
    {
        files: ["**/*.js"],
        rules: {
            ...js.configs.recommended.rules,
        },
    },
];
