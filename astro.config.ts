import { defineConfig } from 'astro/config';

import expressiveCode from 'astro-expressive-code';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import spectre from './package/src';
import tailwindcss from "@tailwindcss/vite";

import cloudflare from '@astrojs/cloudflare';
import { spectreDark } from './src/ec-theme';

// https://astro.build/config
const config = defineConfig({
  site: 'https://holadevelopers.blog/',
  output: 'static',
  integrations: [
    expressiveCode({
      themes: [spectreDark],
    }),
    mdx(),
    sitemap(),
    spectre({
      name: 'Hola Developers!',
      subtitle: 'by',
      openGraph: {
        image:{
          title: '../blog/src/assets/pfp.jpg',
        },
        home: {
          title: `Hola Developers!'s Blog`,
          description: 'Un blog para personas que aman la programación y disfrutan explorando nuevas posibilidades'
        },
        blog: {
          title: 'Blog',
          description: 'Tuturiales y temas interesantes'
        },
        projects: {
          title: 'Projects'
        },
        challenges: {
          title: 'Challenges'
        }
      },
      giscus: {
        repository: 'johnnyfinchdev/blog',
        repositoryId: 'R_kgDOQEOfRA',
        category: 'General',
        categoryId: 'DIC_kwDOQEOfRM4C3Itz',
        mapping: 'title',
        strict: false,
        reactionsEnabled: true,
        emitMetadata: false,
        inputPosition: 'top',
        theme:"catppuccin_mocha",
        lang: 'es',
        loading: 'lazy',
      }
    })
  ],
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
  },
});

export default config;
