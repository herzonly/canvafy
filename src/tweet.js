"use strict";

const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = class Tweet {
  constructor(options) {
    this.font = { name: options?.font?.name ?? "Chirp", path: options?.font?.path };
    this.avatar = "https://cdn.discordapp.com/avatars/928259219038302258/299ebac2bc13f5a8f44d2dd1f0c9f856.png?size=1024";
    this.comment = "This is a tweet card. You can customize it as you wish. Enjoy! #Canvafy";
    this.verified = false;
    this.client = null;
    this.theme = "light";
    this.user = { displayName: "Beş", username: "fivesobes" };
    this.emojiCache = new Map();
  }

  setAvatar(image) {
    this.avatar = image;
    return this;
  }

  setUser({ displayName, username }) {
    this.user = { displayName, username };
    return this;
  }

  setComment(text) {
    this.comment = text;
    return this;
  }

  setTheme(theme) {
    if (!["dark", "light", "dim"].some(e => e == theme)) throw new Error("Invalid theme");
    this.theme = theme;
    return this;
  }

  setVerified(verified) {
    if (typeof verified !== "boolean") throw new Error("Verified must be a boolean");
    this.verified = verified;
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

  async drawTextWithEmoji(ctx, text, x, y, fontSize, color, font) {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Extended_Pictographic})/gu;
    
    if (!emojiRegex.test(text)) {
      ctx.fillStyle = color;
      ctx.font = font;
      ctx.fillText(text, x, y);
      return ctx.measureText(text).width;
    }

    const parts = text.split(emojiRegex).filter(part => part !== '');
    let currentX = x;
    let totalWidth = 0;

    ctx.fillStyle = color;
    ctx.font = font;

    for (const part of parts) {
      if (emojiRegex.test(part)) {
        const emojiImage = await this.loadEmojiImage(part);
        if (emojiImage) {
          ctx.drawImage(emojiImage, currentX, y - fontSize * 0.8, fontSize, fontSize);
          currentX += fontSize;
          totalWidth += fontSize;
        } else {
          ctx.fillText(part, currentX, y);
          const partWidth = ctx.measureText(part).width;
          currentX += partWidth;
          totalWidth += partWidth;
        }
      } else if (part.trim()) {
        ctx.fillText(part, currentX, y);
        const partWidth = ctx.measureText(part).width;
        currentX += partWidth;
        totalWidth += partWidth;
      }
    }

    return totalWidth;
  }

  async build() {
    if (this.font.path) {
      registerFont(this.font.path, { family: this.font.name });
    }

    var canvas = createCanvas(968, 343);
    var ctx = canvas.getContext("2d");
    var totalHeight = await this.calculateHeight(ctx, this.comment);
    canvas = createCanvas(968, 343 + totalHeight);
    ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.fillStyle = this.theme === "dim" ? "#15202b" : this.theme == "light" ? "#fff" : "#000";
    ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);

    const displayNameColor = this.theme === "dim" ? "#fff" : this.theme == "light" ? "#000" : "#fff";
    const displayNameWidth = await this.drawTextWithEmoji(ctx, this.user.displayName, 130, 70, 25, displayNameColor, "25px Chirp");

    ctx.fillStyle = this.theme === "dim" ? "#8493a2" : this.theme == "light" ? "#000" : "#8493a2";
    ctx.textAlign = "left";
    ctx.font = "25px Chirp";
    ctx.fillText("@" + this.user.username, 130, 100);

    if (this.verified === true) {
      ctx.drawImage(await loadImage(`${__dirname}/../assets/images/twitter-verified.png`), (displayNameWidth + 140), 48, 30, 30);
    }

    await this.writeComment(ctx, this.comment, this.theme);

    try {
      ctx.drawImage(await loadImage(`${__dirname}/../assets/images/reply.png`), 186.6, canvas.height - 68, 45, 45);
      ctx.drawImage(await loadImage(`${__dirname}/../assets/images/retweet.png`), 384, canvas.height - 68, 45, 45);
      ctx.drawImage(await loadImage(`${__dirname}/../assets/images/like.png`), 577.8, canvas.height - 68, 45, 45);
      ctx.drawImage(await loadImage(`${__dirname}/../assets/images/share.png`), 771, canvas.height - 68, 45, 45);
      ctx.drawImage(await loadImage(`${__dirname}/../assets/images/other.png`), 900, 40, 35, 35);
    } catch (err) {
      console.log(err);
    }

    ctx.strokeStyle = "#8493a2";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, canvas.height - 88);
    ctx.lineTo(918, canvas.height - 88);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(80, 75, 40, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    try {
      ctx.drawImage(await loadImage(this.avatar), 93 - 58, 28, 90, 90);
    } catch {
      throw new Error("The image given in the argument of the setAvatar method is not valid or you are not connected to the internet.");
    }

    return canvas.toBuffer('image/png');
  }

  async writeComment(ctx, comment, theme) {
    comment = comment.length > 2490 ? comment.slice(0, 2490) + "..." : comment;
    
    if (!comment.includes(" ")) {
      comment = comment.length > 57 ? comment.slice(0, 57) + "..." : comment;
      const color = theme == "light" ? "#000" : "#fff";
      await this.drawTextWithEmoji(ctx, comment, 85, 170, 25, color, "25px Chirp");
      return;
    }

    var words = comment.split(' ');
    var line = '';
    var lineHeight = 40;
    var x = 85;
    var y = 170;

    for (var i = 0; i < words.length; i++) {
      var testLine = line + words[i] + ' ';
      ctx.font = "25px Chirp";
      var metrics = ctx.measureText(testLine).width;
      
      if (metrics > 800) {
        const color = theme == "light" ? "#000" : "#fff";
        await this.drawTextWithEmoji(ctx, line, x, y, 25, color, "25px Chirp");
        line = words[i] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    
    const color = theme == "light" ? "#000" : "#fff";
    await this.drawTextWithEmoji(ctx, line, x, y, 25, color, "25px Chirp");
  }

  async calculateHeight(ctx, comment) {
    comment = comment.length > 2490 ? comment.slice(0, 2490) + "..." : comment;
    
    if (!comment.includes(" ")) {
      comment = comment.length > 57 ? comment.slice(0, 57) + "..." : comment;
      return 40;
    }

    var words = comment.split(' ');
    var line = '';
    var lineHeight = 40;
    var totalHeight = 0;

    ctx.font = "25px Chirp";
    
    for (var i = 0; i < words.length; i++) {
      var testLine = line + words[i] + ' ';
      var metrics = ctx.measureText(testLine).width;
      
      if (metrics > 800) {
        line = words[i] + ' ';
        totalHeight += lineHeight * 2.2;
      } else {
        line = testLine;
      }
    }
    
    totalHeight += lineHeight;
    return totalHeight;
  }
};
