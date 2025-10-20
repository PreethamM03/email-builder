import type { Data } from "@measured/puck";

export const sampleData: Data = {
  root: { props: {} },
  content: [
    {
      type: "Container",
      props: { padding: 24, maxWidth: 600, background: "#ffffff", id: "container-1",content: [
        { type: "Image", props: { src: "https://placehold.co/600x200?text=Welcome", alt: "Hero", width: 600, id: "image-1" } },
            { type: "Heading", props: { content: "Hello from Nautilus 👋", level: "h1", align: "left", color: "#111111", id: "heading-1" } },
            { type: "Text", props: { content: "This is a lightweight drag-and-drop email. Customize the text, drop in a button, and you're done.", align: "left", color: "#333333", id: "text-1" } },
            { type: "Button", props: { label: "Get Started", href: "https://example.com", bg: "#5865f2", color: "#ffffff", radius: 8, paddingX: 16, paddingY: 12, id: "button-1" } }
      ] },
      
    },
  ],
};
