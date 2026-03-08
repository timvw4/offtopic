/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        // Autorise toutes les URLs Supabase Storage (*.supabase.co)
        // Nécessaire pour afficher les dessins stockés dans le bucket "drawings"
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
