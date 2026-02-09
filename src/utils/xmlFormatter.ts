// XML Pretty Printer

/**
 * Formats XML string with proper indentation
 * @param xml - Raw XML string
 * @returns Formatted XML with indentation
 */
export function formatXmlString(xml: string): string {
  if (!xml) return '';
  
  try {
    let formatted = '';
    const reg = /(>)(<)(\/*)/g;
    let transition = xml.replace(reg, '$1\r\n$2$3');
    let pad = 0;
    
    transition.split('\r\n').forEach((node) => {
      let indent = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (node.match(/^<\/\w/)) {
        if (pad !== 0) pad -= 1;
      } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }
      
      let padding = '';
      for (let i = 0; i < pad; i++) {
        padding += '  ';
      }
      
      formatted += padding + node + '\r\n';
      pad += indent;
    });
    
    return formatted.trim();
  } catch (e) {
    return xml;
  }
}