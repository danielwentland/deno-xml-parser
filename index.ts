import {decodeXML} from "https://raw.githubusercontent.com/DenoBRComunitty/entities/master/mod.ts"
interface Document {
  declaration: XmlDeclaration | undefined
  root: XmlRoot | undefined
}

type XmlAttributes = {
  [name: string]: string;
}

interface XmlNode extends XmlRoot{
  content?: string;
}

interface XmlRoot {
  name: string;
  attributes: XmlAttributes;
  children: XmlNode[];
}

interface XmlDeclaration {
  attributes: XmlAttributes
}

interface XmlAttribute {
   name: string
   value: string
}


/**
 * Parse the given string of `xml`.
 *
 * @param {string} xml
 * @return {Document}
 * @api public
 */

export default function parse(xml: string): Document {
  xml = xml.trim();

  // strip comments, whitespaces and newlines
  xml = xml.replace(/((?<=>)(\s+)|^\s+|<!--[\s\S]*?-->)/g, "");

  return document();

  /**
   * XML document.
   */

  function document(): Document {
    return {
      declaration: declaration(),
      root: tag()
    };
  }

  /**
   * Declaration.
   */

  function declaration(): XmlDeclaration | undefined {
    var attr: XmlAttribute|undefined
    var m = match(/^<\?xml\s*/);
    if (!m) return;

    // tag
    var xmlDeclaration: XmlDeclaration =  {
      attributes: {}
    }

    // attributes
    while (!(eos() || is("?>"))) {
      attr = attribute();
      if (!attr) return xmlDeclaration;
      xmlDeclaration.attributes[attr.name] = attr.value;
    }

    match(/\?>\s*/);

    return xmlDeclaration;
  }

  /**
   * Tag.
   */

  function tag(): XmlNode | undefined {
    var m = match(/^<([\w-:.]+)\s*/);
    var attr: XmlAttribute | undefined
    if (!m) return;

    // name
    var node: XmlNode = {
      name: m[1],
      attributes: {},
      children: []
    };

    // attributes
    while (!(eos() || is(">") || is("?>") || is("/>"))) {
      attr = attribute();
      if (!attr) return node;
      node.attributes[attr.name] = attr.value;
    }

    // self closing tag
    if (match(/^\s*\/>\s*/)) {
      return node;
    }

    match(/\??>\s*/);

    // content
    node.content = content();

    // children
    var child;
    while ((child = tag())) {
      node.children.push(child);
    }

    // closing
    match(/^<\/[\w-:.]+>\s*/);

    return node;
  }

  /**
   * Get text content
   * 
   * Gets plain content and CDATA content.
   * 
   * @returns {string} Content of xml tag
   */
  function content(): string {
    var m = match(/((^<!\[CDATA\[)(.*?)(\]\]>)|^([^<]*))/)
    if (!m) return ""
    
    if (m[2] == '<![CDATA['){
      return m[3]
    }
    return decodeXML(m[1])
  }

  /**
   * Attribute.
   */

  function attribute(): XmlAttribute | undefined {
    var m = match(/([\w:-]+)\s*=\s*("[^"]*"|'[^']*'|\w+)\s*/);
    if (!m) return;
    return { name: m[1], value: strip(m[2]) };
  }

  /**
   * Strip quotes from `val`.
   */

  function strip(val: string): string {
    return val.replace(/^['"]|['"]$/g, "");
  }

  /**
   * Match `re` and advance the string.
   */

  function match(re: RegExp): string[] | undefined {
    var m = xml.match(re);
    if (!m) return;
    xml = xml.slice(m[0].length);
    return m;
  }

  /**
   * End-of-source.
   */

  function eos(): boolean {
    return 0 == xml.length;
  }

  /**
   * Check for `prefix`.
   */

  function is(prefix: string): boolean {
    return 0 == xml.indexOf(prefix);
  }
}
