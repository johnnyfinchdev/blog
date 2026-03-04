export default {
  name: "blog",
  compatibility_date: "2025-09-27",
  compatibility_flags: ["nodejs_compat"],
  main: "dist/_worker.js/index.js",
  assets: {
    binding: "ASSETS",
    directory: "dist"
  },
  kv_namespaces: [
    { 
      binding: "NEWSLETTER_DB", 
      id: process.env.NEWSLETTER_DB 
    }
  ]
};