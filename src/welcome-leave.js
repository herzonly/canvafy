"use strict";

const { createCanvas, loadImage, registerFont } = require('canvas');

module.exports = class WelcomeLeave {
  constructor(options) {
    this.font = { 
      name: options?.font?.name ?? "Poppins", 
      path: options?.font?.path 
    };
    this.avatar = "https://cdn.discordapp.com/embed/avatars/0.png";
    this.background = {
      type: "color",
      background: "#23272a"
    };
    this.title = {
      data: "Welcome",
      color: "#fff",
      size: 28
    };
    this.description = {
      data: "Welcome to this server, go read the rules please!",
      color: "#a7b9c5",
      size: 26
    };
    this.overlay_opacity = 0;
    this.border;
    this.avatar_border = "#2a2e35";
    this.emojiCache = new Map();
  }

  setAvatar(image) {
    this.avatar = image;
    return this;
  }

  setAvatarBorder(color) {
    if (color) {
      if (/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(color)) {
        this.avatar_border = color;
        return this;
      } else {
        throw new Error("Invalid color for the argument in the setAvatarBorder method. You must give a hexadecimal color.");
      }
    } else {
      throw new Error("You must give a hexadecimal color as the argument of setAvatarBorder method.");
    }
  }

  setBackground(type, value) {
    if (type === 'color') {
      if (value) {
        if (/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(value)) {
          this.background.type = "color";
          this.background.background = value;
          return this;
        } else {
          throw new Error("Invalid color for the second argument in setBackground method. You must give a hexadecimal color.");
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

  setBorder(color) {
    if (color) {
      if (/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(color)) {
        this.border = color;
        return this;
      } else {
        throw new Error("Invalid color for the argument in the setBorder method. You must give a hexadecimal color.");
      }
    } else {
      throw new Error("You must give a hexadecimal color as the argument of setBorder method.");
    }
  }

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

  setOverlayOpacity(opacity = 0) {
    if (opacity !== undefined && opacity !== null) {
      if (opacity >= 0 && opacity <= 1) {
        this.overlay_opacity = opacity;
        return this;
      } else {
        throw new Error("The value of the opacity of setOverlayOpacity method must be between 0 and 1 (0 and 1 included).");
      }
    }
    return this;
  }

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
      throw new Error("You must give a text as the first argument of setTitle method.");
    }
    return this;
  }

  getEmojiCodePoint(emoji) {
    return Array.from(emoji).map(char => 
      char.codePointAt(0).toString(16)
    ).join('-');
  }

  async loadEmojiImage(emojiChar) {
    if (this.emojiCache.has(emojiChar)) {
      return this.emojiCache.get(emojiChar);
    }

    try {
      const codePoint = this.getEmojiCodePoint(emojiChar);
      const emojiUrl = `https://twemoji.maxcdn.com/v/latest/72x72/${codePoint}.png`;
      
      const emojiImage = await loadImage(emojiUrl);
      this.emojiCache.set(emojiChar, emojiImage);
      return emojiImage;
    } catch (error) {
      return null;
    }
  }

  async drawTextWithEmoji(ctx, text, x, y, fontSize, color, align = 'center') {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Extended_Pictographic})/gu;
    
    if (!emojiRegex.test(text)) {
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.fillText(text, x, y);
      return;
    }

    const parts = text.split(emojiRegex).filter(part => part !== '');
    let totalWidth = 0;
    
    ctx.font = `${fontSize}px Arial`;
    for (const part of parts) {
      if (emojiRegex.test(part)) {
        totalWidth += fontSize * 0.9;
      } else {
        totalWidth += ctx.measureText(part).width;
      }
    }

    let currentX = align === 'center' ? x - totalWidth / 2 : x;

    ctx.fillStyle = color;
    ctx.textAlign = 'left';

    for (const part of parts) {
      if (emojiRegex.test(part)) {
        const emojiImage = await this.loadEmojiImage(part);
        if (emojiImage) {
          ctx.drawImage(emojiImage, currentX, y - fontSize * 0.75, fontSize * 0.9, fontSize * 0.9);
          currentX += fontSize * 0.9;
        } else {
          ctx.fillText(part, currentX, y);
          currentX += ctx.measureText(part).width;
        }
      } else if (part.trim()) {
        ctx.fillText(part, currentX, y);
        currentX += ctx.measureText(part).width;
      }
    }
  }

  async build() {
    if (this.font.path) {
      registerFont(this.font.path, { family: this.font.name });
    }

    const canvas = createCanvas(700, 350);
    const ctx = canvas.getContext("2d");

    if (this.border) {
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

    if (this.background.type === "color") {
      ctx.beginPath();
      ctx.fillStyle = this.background.background;
      ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
    } else if (this.background.type === "image") {
      try {
        ctx.drawImage(await loadImage(this.background.background), 10, 10, canvas.width - 20, canvas.height - 20);
      } catch {
        throw new Error("The image given in the second parameter of the setBackground method is not valid or you are not connected to the internet.");
      }
    }

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

    ctx.globalAlpha = 1;

    ctx.font = `bold ${this.title.size}px ${this.font.name}`;
    ctx.fillStyle = this.title.color;
    ctx.textAlign = "center";
    
    const titleEmojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Extended_Pictographic})/gu;
    if (titleEmojiRegex.test(this.title.data)) {
      await this.drawTextWithEmoji(ctx, this.title.data, canvas.width / 2, 225, this.title.size, this.title.color, 'center');
    } else {
      ctx.fillText(this.title.data, canvas.width / 2, 225);
    }

    ctx.font = `${this.description.size}px Arial`;
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
      
      const descEmojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Extended_Pictographic})/gu;
      if (descEmojiRegex.test(texts[0]) || descEmojiRegex.test(texts[1])) {
        await this.drawTextWithEmoji(ctx, texts[0], canvas.width / 2, 260, this.description.size, this.description.color, 'center');
        await this.drawTextWithEmoji(ctx, texts[1], canvas.width / 2, 295, this.description.size, this.description.color, 'center');
      } else {
        ctx.fillText(texts[0], canvas.width / 2, 260);
        ctx.fillText(texts[1], canvas.width / 2, 295);
      }
    } else {
      const descEmojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Extended_Pictographic})/gu;
      if (descEmojiRegex.test(this.description.data)) {
        await this.drawTextWithEmoji(ctx, this.description.data, canvas.width / 2, 260, this.description.size, this.description.color, 'center');
      } else {
        ctx.fillText(this.description.data, canvas.width / 2, 260);
      }
    }

    ctx.beginPath();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 5;
    ctx.strokeStyle = this.avatar_border;
    ctx.arc(canvas.width / 2, 125, 66, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(canvas.width / 2, 125, 60, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip(); 

    try {
      ctx.drawImage(await loadImage(this.avatar), canvas.width / 2 - 60, 65, 120, 120);
    } catch {
      throw new Error("The image given in the argument of the setAvatar method is not valid or you are not connected to the internet.");
    }

    return canvas.toBuffer('image/png');
  }
};
