"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { createCanvas, loadImage, registerFont } = require("canvas");
const { fillTextWithTwemoji } = require("node-canvas-with-twemoji");

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
      path: options?.font?.path 
    };
    this.avatar = "https://cdn.discordapp.com/embed/avatars/0.png";
    this.background = { type: "color", background: "#23272a" };
    this.title = { data: "Welcome", color: "#fff", size: 36 };
    this.description = { data: "Welcome to this server, go read the rules please!", color: "#a7b9c5", size: 26 };
    this.overlay_opacity = 0;
    this.border;
    this.avatar_border = "#2a2e35";
  }

  setAvatar(image) {
    this.avatar = image;
    return this;
  }

  setAvatarBorder(color) {
    if (color && /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(color)) {
      this.avatar_border = color;
      return this;
    } else throw new Error("Invalid hex color in setAvatarBorder.");
  }

  setBackground(type, value) {
    if (type === "color") {
      if (value && /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(value)) {
        this.background.type = "color";
        this.background.background = value;
        return this;
      } else throw new Error("Invalid color in setBackground.");
    } else if (type === "image") {
      if (value) {
        this.background.type = "image";
        this.background.background = value;
        return this;
      } else throw new Error("setBackground image needs URL or path.");
    } else throw new Error("setBackground type must be 'color' or 'image'.");
  }

  setBorder(color) {
    if (color && /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(color)) {
      this.border = color;
      return this;
    } else throw new Error("Invalid hex color in setBorder.");
  }

  setDescription(text, color = "#a7b9c5") {
    if (!text) throw new Error("setDescription requires text.");
    if (text.length > 80) throw new Error("Max description 80 chars.");
    this.description.data = text;
    if (color && /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(color)) {
      this.description.color = color;
    }
    return this;
  }

  setOverlayOpacity(opacity = 0) {
    if (opacity >= 0 && opacity <= 1) {
      this.overlay_opacity = opacity;
      return this;
    } else throw new Error("Opacity must be between 0 and 1.");
  }

  setTitle(text, color = "#fff") {
    if (!text) throw new Error("setTitle requires text.");
    if (text.length > 20) throw new Error("Max title 20 chars.");
    this.title.data = text;
    if (color && /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(color)) {
      this.title.color = color;
    }
    return this;
  }

  async build() {
    if (this.font.path) {
      try {
        registerFont(this.font.path, { family: this.font.name });
      } catch {
        throw new Error("Invalid font path.");
      }
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

    if (this.background.type === "color") {
      ctx.fillStyle = this.background.background;
      ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
    } else {
      try {
        ctx.drawImage(await loadImage(this.background.background), 10, 10, canvas.width - 20, canvas.height - 20);
      } catch {
        throw new Error("Invalid background image.");
      }
    }

    ctx.globalAlpha = this.overlay_opacity;
    ctx.fillStyle = "#000";
    ctx.fillRect(45, 45, canvas.width - 90, canvas.height - 90);
    ctx.globalAlpha = 1;

    ctx.textAlign = "center";
    ctx.fillStyle = this.title.color;
    ctx.font = `bold ${this.title.size}px ${this.font.name}`;
    await fillTextWithTwemoji(ctx, this.title.data, canvas.width / 2, 225);

    ctx.fillStyle = this.description.color;
    ctx.font = `regular ${this.description.size}px ${this.font.name}`;
    if (this.description.data.length > 35) {
      const parts = (() => {
        const array = [this.description.data, []];
        const substrings = this.description.data.split(" ");
        let i = substrings.length;
        do {
          i--;
          array[1].unshift(substrings[i]);
          substrings.pop();
        } while (substrings.join(" ").length > 35);
        array[0] = substrings.join(" ");
        array[1] = array[1].join(" ");
        return array;
      })();
      await fillTextWithTwemoji(ctx, parts[0], canvas.width / 2, 260);
      await fillTextWithTwemoji(ctx, parts[1], canvas.width / 2, 295);
    } else {
      await fillTextWithTwemoji(ctx, this.description.data, canvas.width / 2, 260);
    }

    ctx.beginPath();
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
      throw new Error("Invalid avatar image.");
    }

    return canvas.toBuffer("image/png");
  }
};
