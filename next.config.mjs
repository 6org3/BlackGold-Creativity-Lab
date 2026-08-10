/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['studio', 'ai-agent', 'workflow-builder', 'design-agent'],
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
