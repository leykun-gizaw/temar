class TextContentDto {
  content!: string;
  link!: string | null;
}

export class TextDto {
  type!: string;
  text!: TextContentDto;
  annotations!: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text!: string;
  href!: string | null;
}

export class RichTextDto {
  rich_text!: Array<TextDto>;
  is_toggleable!: boolean;
  color!: string;
}

export class Heading1Dto {
  heading_1!: RichTextDto;
}

export class Heading2Dto {
  heading_2!: RichTextDto;
}

export class StandalonePageTitleDto {
  title!: {
    title: [{ text: { content: string } }];
  };
}

/**
 * "heading_1": {
        "rich_text": [
          {
            "type": "text",
            "text": {
              "content": "📚 Topics",
              "link": null
            },
            "annotations": {
              "bold": false,
              "italic": false,
              "strikethrough": false,
              "underline": false,
              "code": false,
              "color": "default"
            },
            "plain_text": "📚 Topics",
            "href": null
          }
        ],
        "is_toggleable": false,
        "color": "blue_background"
      }
 */
