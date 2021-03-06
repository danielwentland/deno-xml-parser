import {
  assertEquals,
} from "../deps.ts";
import {parse} from "./../src/parse.ts";


Deno.test("blankStrings", () => {
  const node = parse("");
  assertEquals(node, { declaration: undefined, root: undefined });
});

Deno.test("declarations", () => {
  const node = parse('<?xml version="1.0" ?>');
  assertEquals(node, {
    declaration: {
      attributes: {
        version: "1.0",
      },
    },
    root: undefined,
  });
});

Deno.test("comments", () => {
  const node = parse("<!-- hello --><foo></foo><!-- world -->");
  assertEquals(node.root, {
    name: "foo",
    attributes: {},
    children: [],
    content: "",
  });
});

Deno.test("tags", () => {
  const node = parse("<foo></foo>");
  assertEquals(node.root, {
    name: "foo",
    attributes: {},
    children: [],
    content: "",
  });
});

Deno.test("tagsWithText", () => {
  const node = parse("<foo>hello world</foo>");
  assertEquals(node.root, {
    name: "foo",
    attributes: {},
    children: [],
    content: "hello world",
  });
});

Deno.test("weirdWhitespace", () => {
  const node = parse("<foo \n\n\nbar\n\n=   \nbaz>\n\nhello world</\n\nfoo>");
  assertEquals(node.root, {
    name: "foo",
    attributes: { bar: "baz" },
    children: [],
    content: "hello world",
  });
});

Deno.test("tagsWithAttributes", () => {
  const node = parse(
    "<foo bar=baz some=\"stuff here\" whatever='whoop'></foo>"
  );
  assertEquals(node.root, {
    name: "foo",
    attributes: {
      bar: "baz",
      some: "stuff here",
      whatever: "whoop",
    },
    children: [],
    content: "",
  });
});

Deno.test("nestedTags", () => {
  const node = parse("<a><b><c>hello</c></b></a>");
  assertEquals(node.root, {
    name: "a",
    attributes: {},
    children: [
      {
        name: "b",
        attributes: {},
        children: [
          {
            name: "c",
            attributes: {},
            children: [],
            content: "hello",
          },
        ],
        content: "",
      },
    ],
    content: "",
  });
});

Deno.test("tagsWithText", () => {
  const node = parse("<a>foo <b>bar <c>baz</c></b></a>");
  assertEquals(node.root, {
    name: "a",
    attributes: {},
    children: [
      {
        name: "b",
        attributes: {},
        children: [
          {
            name: "c",
            attributes: {},
            children: [],
            content: "baz",
          },
        ],
        content: "bar ",
      },
    ],
    content: "foo ",
  });
});

Deno.test("selfClosingTags", () => {
  const node = parse('<a><b>foo</b><b a="bar" /><b>bar</b></a>');
  assertEquals(node.root, {
    name: "a",
    attributes: {},
    children: [
      {
        name: "b",
        attributes: {},
        children: [],
        content: "foo",
      },
      {
        name: "b",
        attributes: {
          a: "bar",
        },
        children: [],
      },
      {
        name: "b",
        attributes: {},
        children: [],
        content: "bar",
      },
    ],
    content: "",
  });
});

Deno.test("selfClosingTagsWithoutAttributes", () => {
  const node = parse("<a><b>foo</b><b /> <b>bar</b></a>");
  assertEquals(node.root, {
    name: "a",
    attributes: {},
    children: [
      {
        name: "b",
        attributes: {},
        children: [],
        content: "foo",
      },
      {
        name: "b",
        attributes: {},
        children: [],
      },
      {
        name: "b",
        attributes: {},
        children: [],
        content: "bar",
      },
    ],
    content: "",
  });
});

Deno.test("multilineComments", () => {
  const node = parse("<a><!-- multi-line\n comment\n test -->foo</a>");
  assertEquals(node.root, {
    name: "a",
    attributes: {},
    children: [],
    content: "foo",
  });
});

Deno.test("attributesWithHyphen", () => {
  const node = parse('<a data-bar="baz">foo</a>');
  assertEquals(node.root, {
    name: "a",
    attributes: {
      "data-bar": "baz",
    },
    children: [],
    content: "foo",
  });
});

Deno.test("tagsWithDot", () => {
  const node = parse(
    '<root><c:Key.Columns><o:Column Ref="ol1"/></c:Key.Columns><c:Key.Columns><o:Column Ref="ol2"/></c:Key.Columns></root>'
  );
  assertEquals(node.root, {
    name: "root",
    attributes: {},
    children: [
      {
        name: "c:Key.Columns",
        attributes: {},
        children: [
          {
            name: "o:Column",
            attributes: {
              Ref: "ol1",
            },
            children: [],
          },
        ],
        content: "",
      },
      {
        name: "c:Key.Columns",
        attributes: {},
        children: [
          {
            name: "o:Column",
            attributes: {
              Ref: "ol2",
            },
            children: [],
          },
        ],
        content: "",
      },
    ],
    content: "",
  });
});

Deno.test("tagsWithHyphen", () => {
  const node = parse(
    "<root>" +
      "<data-field1>val1</data-field1>" +
      "<data-field2>val2</data-field2>" +
      "</root>"
  );
  assertEquals(node.root, {
    name: "root",
    attributes: {},
    content: "",
    children: [
      {
        name: "data-field1",
        attributes: {},
        children: [],
        content: "val1",
      },
      {
        name: "data-field2",
        attributes: {},
        children: [],
        content: "val2",
      },
    ],
  });
});

Deno.test("Multiline comment at beginning", () => {
  const node = parse(`
    <!-- Test 
       Long comment
    -->
    <root>
      <data-field1>val1</data-field1>
      <data-field2>val2</data-field2>
    </root>`
  );
  assertEquals(node.root, {
    name: "root",
    attributes: {},
    content: "",
    children: [
      {
        name: "data-field1",
        attributes: {},
        children: [],
        content: "val1",
      },
      {
        name: "data-field2",
        attributes: {},
        children: [],
        content: "val2",
      },
    ],
  });
});

Deno.test("CDATA", () => {
  const node = parse(`
    <root>
      <data-field1><![CDATA[data&field<>1]]></data-field1>
      <data-field2>val2</data-field2>
    </root>`
  );
  assertEquals(node.root, {
    name: "root",
    attributes: {},
    content: "",
    children: [
      {
        name: "data-field1",
        attributes: {},
        children: [],
        content: "data&field<>1",
      },
      {
        name: "data-field2",
        attributes: {},
        children: [],
        content: "val2",
      },
    ],
  });
});

Deno.test("Encoded content", () => {
  const node = parse(`
    <root>
      <data1>Data &amp; Test</data1>
      <data2>&lt;/br&gt;</data2>
    </root>`
  );
  assertEquals(node.root, {
    name: "root",
    attributes: {},
    content: "",
    children: [
      {
        name: "data1",
        attributes: {},
        children: [],
        content: "Data & Test",
      },
      {
        name: "data2",
        attributes: {},
        children: [],
        content: "</br>",
      },
    ],
  });
});
