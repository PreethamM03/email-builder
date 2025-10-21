import type { Config } from "@measured/puck";
import {
  Button,
  Container,
  Img,
  Section,
  Text,
} from "@react-email/components";
import React from "react";


export const serverConfig: Config = {
  components: {
    Container: {
      label: "Container",
      defaultProps: { padding: 24, maxWidth: 600, background: "#ffffff", align: "left" },
      fields: {
        padding: { type: "number", label: "Padding", min: 0, max: 64, step: 4 },
        maxWidth: { type: "number", label: "Max width", min: 320, max: 800, step: 10 },
        background: { type: "text", label: "Background" },
        align: {
          type: "select",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
          label: "Content Align",
        },
        content: { type: "slot", label: "Content" },
      },
      render: ({ padding, maxWidth, background, align, content }) => (
        <Container
          style={{
            padding,
            width: "100%",
            maxWidth,
            backgroundColor: background,
            margin: "0 auto",
            textAlign: align as "left" | "center" | "right",
          }}
        >
          {content}
        </Container>
      ),
    },

    Section: {
      label: "Section",
      defaultProps: { paddingY: 16, paddingX: 16, background: "#ffffff" },
      fields: {
        paddingY: { type: "number", label: "Padding Y", min: 0, max: 64, step: 4 },
        paddingX: { type: "number", label: "Padding X", min: 0, max: 64, step: 4 },
        background: { type: "text", label: "Background" },
        content: { type: "slot", label: "Content" },
      },
      render: ({ paddingY, paddingX, background, content }) => (
        <Section style={{ backgroundColor: background, padding: `${paddingY}px ${paddingX}px` }}>
          {content}
        </Section>
      ),
    },

    Heading: {
      label: "Heading",
      defaultProps: { content: "Welcome!", align: "left", color: "#111111", level: "h2" },
      fields: {
        content: { type: "text", label: "Text" },
        level: {
          type: "select",
          options: [
            { label: "H1", value: "h1" },
            { label: "H2", value: "h2" },
            { label: "H3", value: "h3" },
          ],
          label: "Level",
        },
        align: {
          type: "select",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
          label: "Align",
        },
        color: { type: "text", label: "Color" },
      },
      render: ({ content, level, align, color }) => {
        const size =
          level === "h1" ? 28 : level === "h2" ? 22 : 18;
        return (
          <Text
            style={{
              fontSize: size,
              fontWeight: 700,
              textAlign: align as "left" | "center" | "right",
              color,
              margin: "0 0 8px 0",
            }}
          >
            {content}
          </Text>
        );
      },
    },

    Text: {
      label: "Text",
      defaultProps: { content: "Write something nice…", align: "left", color: "#333333" },
      fields: {
        content: { type: "textarea", label: "Text" },
        align: {
          type: "select",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
          label: "Align",
        },
        color: { type: "text", label: "Color" },
      },
      render: ({ content, align, color }) => (
        <Text style={{ textAlign: align as "left" | "center" | "right", color, lineHeight: "1.5", margin: "0 0 12px 0" }}>
          {content}
        </Text>
      ),
    },

    Button: {
      label: "Button",
      defaultProps: {
        label: "Call to Action",
        href: "https://example.com",
        bg: "#111111",
        color: "#ffffff",
        radius: 6,
        paddingX: 16,
        paddingY: 10,
        align: "left",
      },
      fields: {
        label: { type: "text", label: "Label" },
        href: { type: "text", label: "Link (href)" },
        bg: { type: "text", label: "Background" },
        color: { type: "text", label: "Text Color" },
        radius: { type: "number", label: "Border Radius", min: 0, max: 24, step: 1 },
        paddingX: { type: "number", label: "Padding X", min: 8, max: 32, step: 1 },
        paddingY: { type: "number", label: "Padding Y", min: 6, max: 20, step: 1 },
        align: {
          type: "select",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
          label: "Align",
        },
      },
      render: ({ label, href, bg, color, radius, paddingX, paddingY, align }) => (
        <div style={{ textAlign: align as "left" | "center" | "right" }}>
          <Button
            href={href}
            style={{
              backgroundColor: bg,
              color,
              borderRadius: radius,
              padding: `${paddingY}px ${paddingX}px`,
              display: "inline-block",
              textDecoration: "none",
            }}
          >
            {label}
          </Button>
        </div>
      ),
    },

    Image: {
      label: "Image",
      defaultProps: {
        src: "https://placehold.co/600x200?text=Hero",
        alt: "Image",
        width: 600,
        align: "left",
      },
      fields: {
        src: { type: "text", label: "Src" },
        alt: { type: "text", label: "Alt" },
        width: { type: "number", label: "Width", min: 40, max: 800, step: 10 },
        align: {
          type: "select",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
          label: "Align",
        },
      },
      render: ({ src, alt, width, align }) => {
        const alignStyle = align === "center" 
          ? { display: "block", margin: "0 auto" }
          : align === "right"
          ? { display: "block", marginLeft: "auto" }
          : { display: "block" };
        
        return <Img src={src} alt={alt} width={width} style={alignStyle} />;
      },
    },
  },
};

export type ServerConfig = typeof serverConfig;
