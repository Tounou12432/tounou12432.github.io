// Defaults for every file in src/projects/.
// A project gets its own page at /projects/<file-name>/ only when it sets `detail_page: true`;
// otherwise it appears just as a card in the Projects section.
export default {
  layout: "project.njk",
  eleventyComputed: {
    permalink: (data) => (data.detail_page ? `/projects/${data.page.fileSlug}/` : false),
  },
};
