import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import type { AnyNode, Element } from "domhandler";

export interface XmlDocument {
  $: CheerioAPI;
  root: Element;
}

function isElement(node: AnyNode): node is Element {
  return node.type === "tag" || node.type === "script" || node.type === "style";
}

export function loadXml(xml: string, expectedRoot: string): XmlDocument {
  if (!xml.trim()) {
    throw new Error("The XML file is empty.");
  }

  const $ = cheerio.load(xml, { xml: true });
  const elements = $.root().children().toArray().filter(isElement);

  if (elements.length === 0) {
    throw new Error(`Expected a <${expectedRoot}> root element.`);
  }

  if (elements.length > 1) {
    throw new Error(`Expected a single <${expectedRoot}> root element.`);
  }

  const root = elements[0];
  if (!root) {
    throw new Error(`Expected a <${expectedRoot}> root element.`);
  }

  if (root.tagName.toLowerCase() !== expectedRoot.toLowerCase()) {
    throw new Error(
      `Expected a <${expectedRoot}> root element, found <${root.tagName}>.`,
    );
  }

  return { $, root };
}

export function childText(
  $: CheerioAPI,
  parent: AnyNode,
  tag: string,
): string | undefined {
  const value = $(parent).children(tag).first().text().trim();
  return value === "" ? undefined : value;
}

const NUMBER_PATTERN = /^-?\d+(?:\.\d+)?$/;

export function toNumber(value: string | undefined): number | string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.replace(/,/g, "").trim();
  if (normalized === "") return undefined;
  if (!NUMBER_PATTERN.test(normalized)) return value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : value;
}

export function childNumber(
  $: CheerioAPI,
  parent: AnyNode,
  tag: string,
): number | string | undefined {
  return toNumber(childText($, parent, tag));
}

export function attr(
  node: AnyNode,
  name: string,
): string | undefined {
  if (!isElement(node)) return undefined;
  const value = node.attribs[name]?.trim();
  return value === "" || value === undefined ? undefined : value;
}

export function attrNumber(
  node: AnyNode,
  name: string,
): number | string | undefined {
  return toNumber(attr(node, name));
}
