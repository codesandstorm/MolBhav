import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Static showcase. One React island (the hero ladder); 3D code loads only on demand.
export default defineConfig({ output: 'static', integrations: [react()] });
