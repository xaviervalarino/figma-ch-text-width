console.clear();

type TextNodeFontProps = Pick<TextNode, "fontName" | "fontSize" | "textCase">;

async function resizeTextFrames(width: number) {
  const textFrameProps = new Map<string, TextNodeFontProps>();
  const textFrames = figma.currentPage.selection.filter(
    (node) => node.type === "TEXT"
  ) as unknown as TextNode[];

  await Promise.all(
    textFrames.map(async ({ id, fontName, fontSize, textCase }) => {
      if (fontName === figma.mixed || fontSize === figma.mixed || textCase === figma.mixed) {
        return figma.closePlugin("Can't complete: Text box with mixed fonts");
      }
      console.log(fontName);
      textFrameProps.set(id, { fontName, fontSize, textCase });
      await figma
        .loadFontAsync(fontName)
        .catch(() => figma.closePlugin(`Could not load font ${fontName}`));
    })
  );

  const ch = figma.createText();

  // Resize each text frame to `ch` width
  textFrames.forEach((frame) => {
    const { fontName, fontSize, textCase } = textFrameProps.get(frame.id)!;
    ch.fontName = fontName;
    ch.fontSize = fontSize;
    ch.textCase = textCase;
    // ch = The advance measure (width) of the glyph "0" of the element's font
    if (!ch.characters) ch.characters = "0".repeat(width);
    frame.resize(ch.width, frame.height);
  });

  figma.closePlugin(`Text frames set to ${width} ch`);
}

export default function () {
  figma.parameters.on("input", ({ parameters, key, query, result }: ParameterInputEvent) => {
    console.log("input", parameters, key, query, result);
  });
  figma.on("run", ({ command, parameters }: RunEvent) => {
    console.log("run", command, parameters);
    if (Number.isInteger(+parameters?.ch)) {
      resizeTextFrames(+parameters!.ch);
    }
  });
}
