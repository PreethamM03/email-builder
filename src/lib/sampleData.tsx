import type { Data } from "@measured/puck";
// sample data for the email builder
export const sampleData: Data = {
  root: { props: {} },
  content: [
    {
      type: "Container",
      props: { padding: 24, maxWidth: 600, background: "#ffffff", align: "left", id: "container-1",content: [
        { type: "Image", props: { src: "https://media.licdn.com/dms/image/v2/D4E3DAQGcgvoGdpIMMw/image-scale_191_1128/image-scale_191_1128/0/1727734930316/nautilusai_cover?e=2147483647&v=beta&t=kceumfl23FgkvBCG3imnaNnrXicxGqDjMeP6KwTtqrg", alt: "Hero", width: 600, align: "left", id: "image-1" } },
            { type: "Heading", props: { content: "Hello from Nautilus 👋", level: "h1", align: "center", color: "#111111", id: "heading-1" } },
            { type: "Text", props: { content: "This is a lightweight drag-and-drop email. Customize the text, drop in a button, and you're done.", align: "center", color: "#333333", id: "text-1" } },
            { type: "Button", props: { label: "Get Started", href: "https://nautilus.co/", bg: "#5865f2", color: "#ffffff", radius: 8, paddingX: 16, paddingY: 12, align: "center", id: "button-1" } }
      ] },
      
    },
  ],
};
