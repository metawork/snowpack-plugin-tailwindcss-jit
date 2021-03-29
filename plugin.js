const fs = require("fs");
const path = require("path");
const micromatch = require("micromatch");

const TAILWIND_IMPORT_REGEX = /\@import\s+['"](tailwindcss\/.+)['"].*|\@tailwind\s+.*/g;

module.exports = (snowpackConfig, pluginOptions) => {
  
  console.log("plugin options", pluginOptions);
  const tailwindConfigPath = pluginOptions.tailwindConfigFilePath || "/tailwind.config.js"
  const tailwindConfig = require("tailwindcss/resolveConfig")(require(path.join(process.cwd(), tailwindConfigPath)));
  let filesWithTailwindImports = [];
  return {
    name: "@jadex/snowpack-plugin-tailwindcss-jit",
    resolve: {
      input: [".pcss", ".css"],
      output: [".css"],
    },
    onChange({ filePath }) {
      if (!micromatch.isMatch(filePath, tailwindConfig.purge.content ?? tailwindConfig.purge)) {
        return;
      }

      filesWithTailwindImports.forEach((filePath) => this.markChanged(filePath));
    },
    /** Load files that contain TailwindCSS imports*/
    async load({ filePath, isDev }) {
      if (!isDev || filesWithTailwindImports.includes(filePath)) {
        return;
      }

      const fileContents = fs.readFileSync(filePath, "utf8");
      const regex = new RegExp(TAILWIND_IMPORT_REGEX);

      if (regex.test(fileContents)) {
        filesWithTailwindImports.push(filePath);
      }
    },
  };
};
