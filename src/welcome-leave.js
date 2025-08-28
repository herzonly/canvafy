"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { createCanvas, loadImage, registerFont } = require('canvas');
const { fillTextWithTwemoji } = require('node-canvas-with-twemoji');
const fs = require('fs');
const path = require('path');

/**
 * Helper function to fix SVG issues by adding width and height if missing
 * @param {string} svgContent - SVG content as string
 * @param {number} width - Desired width
 * @param {number} height - Desired height
 * @returns {string} - Fixed SVG content
 */
function fixSvgDimensions(svgContent, width = 800, height = 600) {
  // Check if SVG already has width and height
  if (svgContent.includes('width=') && svgContent.includes('height=')) {
    return svgContent;
  }
  
  // Add width and height to SVG element
  const svgTagRegex = /<svg([^>]*)>/i;
  const match = svgContent.match(svgTagRegex);
  
  if (match) {
    let attributes = match[1];
    if (!attributes.includes('width=')) {
      attributes += ` width="${width}"`;
    }
    if (!attributes.includes('height=')) {
      attributes += ` height="${height}"`;
    }
    return svgContent.replace(svgTagRegex, `<svg${attributes}>`);
  }
  
  return svgContent;
}

/**
 * @typedef {object} WelcomeLeave
 * @see {WelcomeLeave}
 * @example const welcomeCard = await new canvafy.WelcomeLeave()
 * @example const leaveCard = await new canvafy.WelcomeLeave()
 * @type {Class}
 */
module.exports = class WelcomeLeave {
  constructor(options) {
    this.font = { 
      name: options?.font?.name ?? "Poppins", 
      path: options?.font?.path ?? "./assets/fonts/Poppins/Poppins-Regular.ttf" 
    };
    this.avatar = "https://cdn.discordapp.com/embed/avatars/0.png";
    this.background = {
      type: "color",
      background: "#23272a"
    };
    this.title = {
      data: "Welcome",
      color: "#fff",
      size: 36
    };
    this.description = {
      data: "Welcome to this server, go read the rules please!",
      color: "#a7b9c5",
      size: 26
    };
    this.overlay_opacity = 0;
    this.border;
    this.avatar_border = "#2a2e35";
  }

  /**
   * .setAvatar
   * @param {string} image Set User Avatar URL
   * @returns {WelcomeLeave}
   * @example setAvatar("https://someone-image.png")
   */
  setAvatar(image) {
    this.avatar = image;
    return this;
  }

  /**
   * .setAvatarBorder
   * @param {string} color Set Avatar Avatar Border Color
   * @returns {WelcomeLeave}
   * @example setAvatarBorder("#fff")
   */
  setAvatarBorder(color) {
    if (color) {
      if (/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(color)) {
        this.avatar_border = color;
        return this;
      } else {
        throw new Error("Invalid color for the argument in the setBorder method. You must give a hexadecimal color.")
      }
    } else {
      throw new Error("You must give a hexadecimal color as the argument of setBorder method.");
    }
  }

  /**
   * .setBackground
   * @param {string} type "image" or "color"
   * @param {string|Buffer|Image} value "url" or "hexcolor"
   * @returns {WelcomeLeave}
   * @example setBackground("image","https://someone-image.png")
   * @example setBackground("color","#000")
   */
  setBackground(type, value) {
    if (type === 'color') {
      if (value) {
        if (/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(value)) {
          this.background.type = "color";
          this.background.background = value;
          return this;
        } else {
          throw new Error("Invalid color for the second argument in setForeground method. You must give a hexadecimal color.");
        }
      } else {
        throw new Error("You must give a hexadecimal color as a second argument of setBackground method.");
      }
    } else if (type === 'image') {
      if (value) {
        this.background.type = "image";
        this.background.background = value;
        return this;
      } else {
        throw new Error("You must give a background URL as a second argument.");
      }
    } else {
      throw new Error("The first argument of setBackground must be 'color' or 'image'.");
    }
  }

  /**
   * .setBorder
   * @param {string} color "hexcolor"
   * @returns {WelcomeLeave}
   * @example setBorder("#fff")
   */
  setBorder(color) {
    if (color) {
      if (/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(color)) {
        this.border = color;
        return this;
      } else {
        throw new Error("Invalid color for the argument in the setBorder method. You must give a hexadecimal color.")
      }
    } else {
      throw new Error("You must give a hexadecimal color as the argument of setBorder method.");
    }
  }

  /**
   * .setDescription
   * @param {string} text Description
   * @param {string} color "hexcolor"
   * @returns {WelcomeLeave}
   * @example setDescription("Welcome to Server.")
   */
  setDescription(text, color = "#a7b9c5") {
    if (text) {
      if (text.length > 80) throw new Error("The maximum size of the description is 80 characters.");
      this.description.data = text;
      if (color) {
        if (/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(color)) {
          this.description.color = color;
        }
      }
    } else {
      throw new Error("You must give a text as the first argument of setDescription method.");
    }
    return this;
  }

  /**
   * .setOverlayOpacity
   * @param {number} opacity must be between 0 and 1
   * @returns {WelcomeLeave}
   * @example setOverlayOpacity(0.6)
   */
  setOverlayOpacity(opacity = 0) {
    if (opacity) {
      if (opacity >= 0 && opacity <= 1) {
        this.overlay_opacity = opacity;
        return this;
      } else {
        throw new Error("The value of the opacity of setOverlayOpacity method must be between 0 and 1 (0 and 1 included).");
      }
    }
    return this;
  }

  /**
   * Helper method to load image with SVG handling
   * @param {string} imageSource - Image URL or path
   * @returns {Promise} - Promise resolving to loaded image
   */
  async loadImageSafely(imageSource) {
    try {
      // If it's an SVG URL, we might need special handling
      if (typeof imageSource === 'string' && imageSource.toLowerCase().includes('.svg')) {
        // For remote SVGs, we can't easily modify them, so just try loading
        // Local SVGs would need special handling
        console.warn('Loading SVG image, this might cause issues if SVG lacks width/height attributes');
      }
      
      return await loadImage(imageSource);
    } catch (error) {
      console.error('Error loading image:', error);
      throw error;
    }
  }
  /** * @param {string} text Title
   * @param {string} color "hexcolor"
   * @returns {WelcomeLeave}
   * @example setTitle("fivesobes")
   */
  setTitle(text, color = "#fff") {
    if (text) {
      if (text.length > 20) throw new Error("The maximum size of the title is 20 characters.");
      this.title.data = text;
      if (color) {
        if (/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(color)) {
          this.title.color = color;
        }
      }
    } else {
      throw new Error("You must give a text as the first argument of setDescription method.");
    }
    return this;
  }

  async build() {
    // Register font using canvas registerFont method
    if (this.font.path && fs.existsSync(this.font.path)) {
      try {
        registerFont(this.font.path, { family: this.font.name });
      } catch (err) {
        console.warn('Font not found or could not be registered, using default font');
      }
    }

    const canvas = createCanvas(700, 350);
    const ctx = canvas.getContext("2d");
    
    // Draw border if set
    if(this.border){
      ctx.beginPath();
      ctx.lineWidth = 8;
      ctx.strokeStyle = this.border;
      ctx.moveTo(55, 15);
      ctx.lineTo(canvas.width - 55, 15);
      ctx.quadraticCurveTo(canvas.width - 20, 20, canvas.width - 15, 55);
      ctx.lineTo(canvas.width - 15, canvas.height - 55);
      ctx.quadraticCurveTo(canvas.width - 20, canvas.height - 20, canvas.width - 55, canvas.height - 15);
      ctx.lineTo(55, canvas.height - 15);
      ctx.quadraticCurveTo(20, canvas.height - 20, 15, canvas.height - 55);
      ctx.lineTo(15, 55);
      ctx.quadraticCurveTo(20, 20, 55, 15);
      ctx.lineTo(56, 15);
      ctx.stroke();
      ctx.closePath();
    }
    
    // Create main rounded rectangle path for clipping
    ctx.beginPath();
    ctx.moveTo(65, 25);
    ctx.lineTo(canvas.width - 65, 25);
    ctx.quadraticCurveTo(canvas.width - 25, 25, canvas.width - 25, 65);
    ctx.lineTo(canvas.width - 25, canvas.height - 65);
    ctx.quadraticCurveTo(canvas.width - 25, canvas.height - 25, canvas.width - 65, canvas.height - 25);
    ctx.lineTo(65, canvas.height - 25);
    ctx.quadraticCurveTo(25, canvas.height - 25, 25, canvas.height - 65);
    ctx.lineTo(25, 65);
    ctx.quadraticCurveTo(25, 25, 65, 25);
    ctx.lineTo(66, 25);
    ctx.closePath();
    ctx.clip();

    ctx.globalAlpha = 1;

    // Draw background
    if (this.background.type === "color") {
      ctx.beginPath();
      ctx.fillStyle = this.background.background;
      ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20)
    } else if (this.background.type === "image") {
      try {
        const backgroundImage = await this.loadImageSafely(this.background.background);
        ctx.drawImage(backgroundImage, 10, 10, canvas.width - 20, canvas.height - 20);
      } catch (error) {
        console.error('Background image error:', error);
        // Fallback to default color background
        ctx.beginPath();
        ctx.fillStyle = "#23272a";
        ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
      }
    }

    // Draw overlay
    ctx.beginPath();
    ctx.globalAlpha = this.overlay_opacity;
    ctx.fillStyle = "#000";
    ctx.moveTo(75, 45);
    ctx.lineTo(canvas.width - 75, 45);
    ctx.quadraticCurveTo(canvas.width - 45, 45, canvas.width - 45, 75);
    ctx.lineTo(canvas.width - 45, canvas.height - 75);
    ctx.quadraticCurveTo(canvas.width - 45, canvas.height - 45, canvas.width - 75, canvas.height - 45);
    ctx.lineTo(75, canvas.height - 45);
    ctx.quadraticCurveTo(45, canvas.height - 45, 45, canvas.height - 75);
    ctx.lineTo(45, 75);
    ctx.quadraticCurveTo(45, 45, 75, 45);
    ctx.fill();
    ctx.closePath();

    // Draw title with emoji support
    ctx.font = `bold ${this.title.size}px ${this.font.name}`;
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.title.color;
    ctx.textAlign = "center";
    
    await fillTextWithTwemoji(ctx, this.title.data, canvas.width / 2, 225);

    // Draw description with emoji support
    ctx.font = `${this.description.size}px ${this.font.name}`;
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.description.color;
    ctx.textAlign = "center";

    if (this.description.data.length > 35) {
      const texts = (function (string) {
        const array = [string, []];
        const substrings = string.split(" ");
        let i = substrings.length;

        do {
          i--;
          array[1].unshift(substrings[i]);
          substrings.pop();
        } while (substrings.join(" ").length > 35);

        array[0] = substrings.join(" ");
        array[1] = array[1].join(" ");
        return array;
      })(this.description.data);
      
      await fillTextWithTwemoji(ctx, texts[0], canvas.width / 2, 260);
      await fillTextWithTwemoji(ctx, texts[1], canvas.width / 2, 295);
    } else {
      await fillTextWithTwemoji(ctx, this.description.data, canvas.width / 2, 260);
    }

    // Draw avatar border
    ctx.beginPath();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 5;
    ctx.strokeStyle = this.avatar_border;
    ctx.arc(canvas.width / 2, 125, 66, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();

    // Create circular clipping path for avatar
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 125, 60, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip(); 

    // Draw avatar
    try {
      const avatarImage = await loadImage(this.avatar);
      // Additional check for SVG avatars
      if (typeof this.avatar === 'string' && this.avatar.toLowerCase().includes('.svg')) {
        console.warn('SVG avatars may cause issues. Consider using PNG/JPG instead.');
      }
      ctx.drawImage(avatarImage, canvas.width / 2 - 60, 65, 120, 120);
    } catch (error) {
      console.error('Avatar image error:', error);
      // Draw a fallback circle for avatar
      ctx.beginPath();
      ctx.fillStyle = "#36393f";
      ctx.arc(canvas.width / 2, 125, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
    }

    return canvas.toBuffer('image/png');
  }
};
