window.__ModuleLoader__.load({
  id: "dsh-tomatronic-child-raise",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let react = require("react");
    const h = react.createElement;
    const { useState, useEffect, useCallback, useRef } = react;

    // 配色硬约束：只有三个强调色——番茄红、橄榄绿、赭黄；
    // 第四色白色只用于卡片/输入面板；其余层次用黑/番茄的 alpha。
    const CR_COLOR = { tomato: "#D24B36", black: "#000000", white: "#FFFFFF" };
    const NS = "dsh-tomatronic-child-raise";
    const PANEL_ID = "child-raise";
    const BASE = "/api/dsh-tomatronic-child-raise";

    // ── 样式（幂等；中性明暗 + 番茄红，尽量走 DSH token）──
    if (typeof document !== "undefined" && !document.getElementById("cr-style")) {
      const tag = document.createElement("style");
      tag.id = "cr-style";
      tag.textContent = [
        ".cr-panel,.cr-entry,.cr-launch-page,.cr-onboard,.cr-settings{--cr-bg:#FFFFFF;--cr-card:#FFFFFF;--cr-card2:#FAFAFA;--cr-text:#0F1115;--cr-muted:rgba(0,0,0,.55);--cr-line:rgba(0,0,0,.12);--cr-line-soft:rgba(0,0,0,.08);--cr-input:#FFFFFF;}",
        "body[data-ds-dark-theme] .cr-panel,body[data-ds-dark-theme] .cr-entry,body[data-ds-dark-theme] .cr-launch-page,body[data-ds-dark-theme] .cr-onboard,body[data-ds-dark-theme] .cr-settings{--cr-bg:#151517;--cr-card:#1E1E22;--cr-card2:#26262B;--cr-text:#ECECEC;--cr-muted:rgba(255,255,255,.62);--cr-line:rgba(255,255,255,.16);--cr-line-soft:rgba(255,255,255,.08);--cr-input:#26262B;background:var(--cr-bg)!important;color:var(--cr-text)!important;}",
        ".cr-sidebar-ask{display:flex;align-items:center;gap:6px;border:0;background:transparent;cursor:pointer;padding:5px 7px;border-radius:8px;color:var(--cr-muted,rgba(0,0,0.70));font-size:11px;}",
        ".cr-sidebar-ask:hover{background:rgba(210,75,54,.08);color:#D24B36;}",
        ".cr-sidebar-ask-icon{width:18px;height:18px;color:#D24B36;display:flex;align-items:center;}",
        ".cr-sidebar-ask-icon svg{width:18px;height:18px;}",
        ".cr-sidebar-ask-label{white-space:nowrap;}",




        ".cr-entry,.cr-entry *{box-sizing:border-box;}",
        ".cr-onboard,.cr-onboard *{box-sizing:border-box;}",
        ".cr-entry{height:100%;min-height:100%;overflow:auto;padding:28px 24px;background:var(--cr-bg,#FAFAFA);box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;}",
        ".cr-entry-hero{width:100%;max-width:860px;margin:0 auto 14px;text-align:center;display:flex;flex-direction:column;align-items:center;background:var(--cr-card,#FFFFFF);border:1px solid rgba(0,0,0,.08);border-radius:18px;padding:24px 20px 20px;box-shadow:0 2px 10px rgba(0,0,0,.035);}",
        ".cr-entry-hero h1{font-size:30px;letter-spacing:-.02em;margin:9px 0 5px;}",
        ".cr-entry-hero p{font-size:12.5px;line-height:1.6;color:var(--cr-muted,rgba(0,0,0.56));max-width:600px;margin:0;}",
        ".cr-entry-hero .cr-entry-features{margin:14px 0 0;justify-content:center;}",
        ".cr-entry-workspace{display:flex;align-items:center;gap:8px;width:100%;max-width:860px;margin:0 auto 7px;padding:7px 10px;border:1px solid rgba(0,0,0,.10);border-radius:10px;background:var(--cr-card,#FFFFFF);}",
        ".cr-entry-workspace-label{font-size:10px;color:var(--cr-muted,rgba(0,0,0.45));flex:0 0 auto;}",
        ".cr-entry-workspace-input{min-width:0;flex:1;height:26px;padding:0 7px;border:1px solid rgba(0,0,0,.12);border-radius:6px;background:var(--cr-card,#FFFFFF);font:inherit;font-size:10.5px;color:var(--cr-muted,rgba(0,0,0.68));}",
        ".cr-entry-workspace .cr-btn{flex:0 0 auto;height:24px;padding:0 8px;font-size:10px;}",
        ".cr-entry-workspace-note{width:100%;max-width:860px;margin:0 auto 12px;font-size:10.5px;color:var(--cr-muted,rgba(0,0,0.50));text-align:left;}",
        ".cr-entry-buttons{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;width:100%;max-width:860px;margin:0 auto;}",
        ".cr-entry-btn{display:flex;flex-direction:column;align-items:flex-start;gap:5px;min-height:118px;min-width:0;width:100%;overflow:hidden;padding:14px;border:1px solid rgba(0,0,0,.12);border-radius:16px;background:var(--cr-card,#FFFFFF);cursor:pointer;font:inherit;text-align:left;box-shadow:0 1px 2px rgba(0,0,0,.03);transition:transform .14s ease,border-color .14s ease,box-shadow .14s ease;}",
        ".cr-entry-btn.primary{background:#D24B36;border-color:#D24B36;color:#FFFFFF;box-shadow:0 8px 22px rgba(210,75,54,.18);}",
        ".cr-entry-btn.primary .cr-entry-btn-icon{background:rgba(255,255,255,.18);color:#FFFFFF;}",
        ".cr-entry-btn.primary .cr-entry-btn-desc{color:rgba(255,255,255,.78);}",
        ".cr-entry-btn.primary:hover:not(:disabled){border-color:#D24B36;box-shadow:0 12px 28px rgba(210,75,54,.24);}",
        ".cr-entry-btn:hover:not(:disabled){transform:translateY(-2px);border-color:rgba(210,75,54,.35);box-shadow:0 8px 24px rgba(210,75,54,.10);}",
        ".cr-entry-btn.active{border-color:#D24B36;background:rgba(210,75,54,.055);}",
        ".cr-entry-btn:disabled{opacity:.5;cursor:default;}",
        ".cr-entry-btn-icon{width:30px;height:30px;border-radius:9px;background:rgba(210,75,54,.10);color:#D24B36;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;margin-bottom:3px;}",
        ".cr-entry-btn b{font-size:14px;max-width:100%;white-space:normal;overflow-wrap:anywhere;}",
        ".cr-entry-btn-desc{font-size:10.5px;line-height:1.45;color:var(--cr-muted,rgba(0,0,0.52));max-width:100%;white-space:normal;overflow-wrap:anywhere;}",
        ".cr-entry-panel{width:100%;max-width:860px;margin:14px auto 0;border:1px solid rgba(0,0,0,.08);border-radius:14px;padding:14px;background:var(--cr-card,#FFFFFF);box-sizing:border-box;}",
        ".cr-entry-panel-title{display:flex;align-items:center;justify-content:space-between;font-weight:700;font-size:12px;margin-bottom:7px;}",
        ".cr-entry-msg{max-width:860px;margin:12px auto 0;font-size:11px;color:var(--cr-muted,rgba(0,0,0.55));}",
        "@media(max-width:760px){.cr-entry-buttons{grid-template-columns:repeat(2,minmax(0,1fr));}}",
        "@media(max-height:700px){.cr-entry{justify-content:flex-start;}}",

        ".cr-entry-head{display:flex;gap:12px;align-items:center;margin-bottom:18px;}",
        ".cr-entry-head h1{font-size:22px;margin:0 0 3px;}",
        ".cr-entry-head p{font-size:12px;color:var(--cr-muted,rgba(0,0,0.55));line-height:1.5;margin:0;}",
        ".cr-entry-features{display:flex;gap:5px;flex-wrap:wrap;margin:0 0 16px;}",
        ".cr-entry-features span{font-size:10px;padding:3px 8px;border-radius:99px;background:rgba(210,75,54,.07);color:var(--cr-muted,rgba(0,0,0.62));}",
        ".cr-entry-actions{display:flex;align-items:flex-start;gap:10px;margin-bottom:18px;}",
        ".cr-entry-action-card{border:1px solid rgba(0,0,0,.10);border-radius:11px;padding:9px;background:var(--cr-card,#FFFFFF);}",
        ".cr-entry-desc{font-size:10.5px;line-height:1.5;color:var(--cr-muted,rgba(0,0,0.53));margin-top:5px;max-width:460px;}",
        ".cr-entry-section{margin:14px 0 18px;}",
        ".cr-entry-title{display:flex;align-items:center;justify-content:space-between;font-weight:700;font-size:12px;margin-bottom:7px;}",
        ".cr-entry-list{display:flex;flex-direction:column;gap:6px;}",
        ".cr-entry-item{display:flex;align-items:center;gap:9px;width:100%;padding:7px 9px;border:1px solid rgba(0,0,0,.10);border-radius:10px;background:var(--cr-card,#FFFFFF);cursor:pointer;font:inherit;}",
        ".cr-entry-item:hover{border-color:rgba(210,75,54,.35);background:rgba(210,75,54,.03);}",
        ".cr-entry-item b{font-size:12px;}",
        ".cr-entry-item .cr-btn{padding:2px 6px;font-size:9.5px;flex:0 0 auto;}",
        ".cr-entry-item .cr-mut{font-size:10px;}",
        ".cr-entry-arrow{color:#D24B36;font-size:14px;}",
        ".cr-entry-modes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}",
        ".cr-entry-mode-card{border:1px solid rgba(0,0,0,.10);border-radius:10px;padding:8px;background:var(--cr-card,#FFFFFF);}",
        ".cr-mode-toggle{display:flex;align-items:center;gap:8px;border:1px solid rgba(0,0,0,.12);background:var(--cr-card,#FFFFFF);border-radius:9px;padding:7px 10px;font:inherit;font-size:11px;cursor:pointer;}",
        ".cr-mode-toggle span{font-size:9.5px;color:var(--cr-muted,rgba(0,0,0.45));border-left:1px solid rgba(0,0,0,.12);padding-left:7px;}",
        ".cr-mode-toggle.on{border-color:rgba(210,75,54,.35);background:rgba(210,75,54,.06);color:#D24B36;}",
        ".cr-mode-toggle.on span{color:#D24B36;}",
        ".cr-mode-toggle:disabled{cursor:default;opacity:.55;}",
        ".cr-launch-page{height:100%;overflow:auto;padding:24px 18px;background:var(--cr-card,#FFFFFF);display:flex;flex-direction:column;align-items:center;justify-content:flex-start;}",
        ".cr-launch-page .cr-onboard{width:min(560px,100%);}",
        ".cr-panel .cr-onboard{background:var(--cr-card,#FFFFFF);}",
        ".cr-launch{display:flex;align-items:center;justify-content:center;height:100%;color:var(--dsw-alias-label-tertiary,rgba(0,0,0,.45));font-size:13px;}",
        ".cr-panel{height:100%;overflow:auto;padding:12px 12px 24px;box-sizing:border-box;color:var(--cr-text,#0F1115);background:var(--cr-bg,#FAFAFA);font-size:13px;line-height:1.55;}",
        ".cr-panel *{box-sizing:border-box;}",
        ".cr-panel-top{display:flex;align-items:center;gap:9px;margin-bottom:8px;flex-wrap:wrap;row-gap:6px;}",
        ".cr-settings{max-width:640px;display:flex;flex-direction:column;}",
        ".cr-settings .cr-field{max-width:520px;}",
        ".cr-settings .cr-m{overflow-wrap:anywhere;}",
        ".cr-settings .cr-sec{margin-top:16px;padding-top:13px;border-top:1px solid rgba(0,0,0,.08);}",
        ".cr-settings .cr-avatar-row{gap:10px;padding:7px 0;border-bottom:1px solid rgba(0,0,0,.06);}",
        ".cr-settings .cr-avatar-row:last-child{border-bottom:0;}",
        ".cr-preg-tabs{display:flex;gap:4px;overflow-x:auto;padding:2px 0 8px;margin:0 0 2px;scrollbar-width:none;}",
        ".cr-preg-tabs::-webkit-scrollbar{display:none;}",
        ".cr-preg-tabs .cr-pill{flex:0 0 auto;height:24px;padding:0 8px;font-size:10.5px;}",
        ".cr-preg-view:not(.all) > .cr-preg-card{display:none;}",
        ".cr-preg-view.edd > .cr-preg-card.edd, .cr-preg-view.checkup > .cr-preg-card.checkup, .cr-preg-view.vitals > .cr-preg-card.vitals, .cr-preg-view.reports > .cr-preg-card.reports, .cr-preg-view.meds > .cr-preg-card.meds, .cr-preg-view.meals > .cr-preg-card.meals, .cr-preg-view.bag > .cr-preg-card.bag{display:block;}",
        ".cr-missing{display:flex;align-items:flex-start;gap:8px;flex-wrap:wrap;margin:0 0 8px;padding:9px 10px;border:1px solid rgba(0,0,0,.10);background:var(--cr-card,#FFFFFF);border-radius:10px;}",
        ".cr-missing b{display:block;font-size:11px;}",
        ".cr-missing span{display:block;font-size:10px;color:var(--cr-muted,rgba(0,0,0.52));line-height:1.5;margin-top:2px;}",
        ".cr-root-bind{display:flex;align-items:flex-start;gap:8px;flex-wrap:wrap;margin:0 0 8px;padding:9px 10px;border:1px solid rgba(210,75,54,.22);background:rgba(210,75,54,.045);border-radius:10px;}",
        ".cr-root-bind b{display:block;font-size:11px;color:#D24B36;}",
        ".cr-root-bind span{display:block;font-size:10px;color:var(--cr-muted,rgba(0,0,0.55));line-height:1.5;margin-top:2px;}",
        ".cr-panel-top .cr-av{width:40px;height:40px;border-radius:13px;}",
        ".cr-panel-top .cr-who{min-width:0;flex:1;} .cr-panel-top .cr-who b{font-size:14px;}",
        ".cr-panel-top .cr-who span{font-size:10.5px;}",
        ".cr-panel-actions{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;}",
        ".cr-panel .cr-card{padding:13px;border-radius:14px;margin-bottom:11px;background:var(--cr-card,#FFFFFF);}",
        ".cr-panel .cr-sec{font-size:14px;margin:14px 0 7px;letter-spacing:.01em;}",
        ".cr-panel .cr-table{font-size:10.5px;}",
        ".cr-panel .cr-table th,.cr-panel .cr-table td{padding:4px 5px;}",
        ".cr-panel .cr-chart{height:160px;}",
        ".cr-routine-embedded{border:1px solid rgba(0,0,0,.10);border-radius:10px;padding:7px 8px;background:rgba(0,0,0,.015);margin:6px 0 4px;}",
        ".cr-routine-embedded .cr-statline{grid-template-columns:repeat(3,minmax(0,1fr));gap:4px 8px;}",
        ".cr-routine-embedded .cr-stat b{font-size:14px;}",
        ".cr-routine-embedded .cr-stat span{font-size:9.5px;}",
        ".cr-live-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;align-items:stretch;}",
        ".cr-live-grid>.cr-card{height:100%;}",
        ".cr-time-notes{display:flex;flex-direction:column;}",
        ".cr-time-note{display:grid;grid-template-columns:38px 1fr auto;gap:5px;align-items:baseline;padding:5px 0;border-bottom:1px solid rgba(0,0,0,.07);font-size:10.5px;}",
        ".cr-time-note b{color:#D24B36;font-size:11px;}",
        ".cr-time-note span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
        ".cr-time-note i{font-style:normal;font-size:9.5px;color:var(--cr-muted,rgba(0,0,0.45));white-space:nowrap;}",
        ".cr-carry-row{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:3px 0;font-size:10px;}",
        ".cr-carry-row span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
        ".cr-carry-est{font-style:normal;font-size:8.5px;color:#D24B36;border:1px solid rgba(210,75,54,.25);border-radius:4px;padding:0 3px;margin-left:3px;}",
        ".cr-carry-row .cr-btn{padding:2px 6px;font-size:9.5px;}",
        ".cr-time-stage{padding:4px 0;border-bottom:1px solid rgba(0,0,0,.06);}",
        ".cr-time-stage b{display:block;font-size:10.5px;line-height:1.35;}",
        ".cr-time-stage span{display:block;font-size:9.5px;line-height:1.4;color:var(--cr-muted,rgba(0,0,0.52));margin-top:1px;}",
        ".cr-time-tip{font-size:11px;line-height:1.55;color:var(--cr-muted,rgba(0,0,0.68));padding:4px 0;}",
        ".cr-key-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}",
        ".cr-key-card{border:1px solid rgba(0,0,0,.12);border-radius:12px;padding:8px;background:var(--cr-card,#FFFFFF);min-width:0;}",
        ".cr-key-title{font-size:10.5px;color:var(--cr-muted,rgba(0,0,0.60));}",
        ".cr-key-value{font-size:18px;font-weight:750;margin:2px 0 4px;}",
        ".cr-key-value span{font-size:10px;font-weight:500;color:var(--cr-muted,rgba(0,0,0.55));}",
        ".cr-key-bars{height:48px;display:flex;align-items:flex-end;gap:2px;border-bottom:1px solid rgba(0,0,0,.10);}",
        ".cr-key-bars i{flex:1;min-width:2px;border-radius:2px 2px 0 0;}",
        ".cr-key-note{font-size:9.5px;color:var(--cr-muted,rgba(0,0,0.45));margin-top:3px;}",
        ".cr-key-edit{display:flex;flex-wrap:wrap;gap:4px;margin:2px 0 6px;}",
        ".cr-avatar-list{display:flex;flex-direction:column;gap:8px;margin:6px 0 10px;}",
        ".cr-avatar-row{display:flex;align-items:center;gap:10px;padding:8px;border:1px solid rgba(0,0,0,.12);border-radius:12px;background:var(--cr-card,#FFFFFF);}",
        ".cr-avatar-colors{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;}",
        ".cr-avatar-swatch{width:18px;height:18px;border-radius:50%;border:2px solid #FFFFFF;box-shadow:0 0 0 1px rgba(0,0,0,.15);cursor:pointer;padding:0;}",
        ".cr-avatar-swatch.on{box-shadow:0 0 0 2px #D24B36;}",
        ".cr-av{width:44px;height:44px;border-radius:14px;background:rgba(210,75,54,.12);color:#D24B36;display:flex;align-items:center;justify-content:center;flex:0 0 auto;}",".cr-avatar-btn{border:0;background:transparent;padding:0;line-height:0;border-radius:14px;cursor:pointer;flex:0 0 auto;}",".cr-avatar-btn:hover{box-shadow:0 0 0 2px rgba(210,75,54,.35);}",".cr-avatar-btn:focus-visible{outline:2px solid #D24B36;outline-offset:2px;}",
        ".cr-who b{display:block;font-size:16px;}",
        ".cr-who span{display:block;font-size:12px;color:var(--dsw-alias-label-tertiary,rgba(0,0,0,.45));}",
        ".cr-grow{flex:1;}",
        ".cr-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:28px;padding:0 10px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));background:var(--dsw-alias-bg-layer-2,#FFFFFF);color:var(--dsw-alias-label-primary,#000000);border-radius:8px;font:inherit;font-size:11px;font-weight:600;line-height:1;white-space:nowrap;cursor:pointer;}",
        ".cr-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05));}",
        ".cr-btn.primary{background:#D24B36;border-color:#D24B36;color:#FFFFFF;}",
        ".cr-btn.ghost{border-color:transparent;background:transparent;color:var(--dsw-alias-label-tertiary,rgba(0,0,0,.45));}",
        ".cr-btn:disabled{opacity:.45;cursor:default;}",
        ".cr-card{background:var(--dsw-alias-bg-layer-2,#FAFAFA);border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.14));border-radius:16px;padding:15px;margin-bottom:12px;}",
        ".cr-recent{flex:1;min-height:0;max-height:none;overflow:auto;background:var(--cr-card,#FFFFFF);border-color:rgba(210,75,54,.20);}",
        ".cr-recent-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:4px 0 8px;}",
        ".cr-recent-stat{background:var(--cr-bg,#FAFAFA);border:1px solid rgba(210,75,54,.14);border-radius:10px;padding:6px 8px;min-width:0;}",
        ".cr-recent-stat b{display:block;font-size:15px;font-variant-numeric:tabular-nums;color:#D24B36;line-height:1.2;}",
        ".cr-recent-stat span{display:block;font-size:9.5px;color:var(--cr-muted,rgba(0,0,0.55));white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
        ".cr-todo-item{display:flex;gap:8px;align-items:flex-start;padding:4px 0;}",
        ".cr-todo-dot{width:12px;height:12px;border:1.5px solid rgba(0,0,0,.22);border-radius:4px;margin-top:3px;flex:0 0 auto;}",
        ".cr-todo-check{width:16px;height:16px;border:1.5px solid rgba(0,0,0,.22);border-radius:5px;background:transparent;cursor:pointer;flex:0 0 auto;margin-top:2px;}",
        ".cr-todo-check:hover{border-color:#D24B36;background:rgba(210,75,54,.12);}",
        ".cr-todo-actions{display:flex;gap:4px;margin-top:2px;}",
        ".cr-todo-actions .cr-btn{padding:2px 6px;font-size:9.5px;}",
        ".cr-todo-text{font-size:12px;line-height:1.45;}",
        ".cr-progress{height:5px;background:rgba(0,0,0,.08);border-radius:99px;overflow:hidden;margin:2px 0 6px;}",
        ".cr-progress i{display:block;height:100%;background:#D24B36;border-radius:99px;}",
        ".cr-recent-item{display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-top:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.08));}",
        ".cr-recent-item:first-of-type{border-top:0;}",
        ".cr-recent-dot{width:7px;height:7px;border-radius:50%;background:#D24B36;margin-top:6px;flex:0 0 auto;}",
        ".cr-recent-label{font-size:12px;line-height:1.5;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}",
        ".cr-recent-date{font-size:10.5px;color:var(--dsw-alias-label-tertiary,rgba(0,0,0,.45));margin-top:1px;}",
        ".cr-kicker{display:flex;gap:8px;align-items:center;margin-bottom:6px;}",
        ".cr-chip{font-size:10.5px;padding:2px 8px;border-radius:999px;background:rgba(210,75,54,.12);color:#D24B36;}",
        ".cr-mut{color:var(--dsw-alias-label-tertiary,rgba(0,0,0,.45));font-size:11.5px;}",
        ".cr-h3{font-size:16px;font-weight:700;margin:0 0 5px;}",
        ".cr-p{margin:0 0 7px;font-size:12.5px;color:var(--dsw-alias-label-secondary,rgba(0,0,0,.65));}",
        ".cr-sec{font-size:14px;font-weight:700;margin:18px 0 8px;display:flex;align-items:baseline;justify-content:space-between;padding-bottom:6px;border-bottom:1px solid rgba(0,0,0,.08);}",
        ".cr-jumps{display:flex;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;padding:6px 2px 8px;margin:0 -2px;position:sticky;top:0;z-index:30;background:var(--cr-bg,#FAFAFA);box-shadow:0 1px 0 rgba(0,0,0,.06);scrollbar-width:none;}",
        ".cr-panel [id^=\"cr-\"]{scroll-margin-top:104px;}",
        "",
        ".cr-jump{flex:1 1 0;min-width:0;height:28px;padding:0 2px;box-sizing:border-box;border:1px solid rgba(0,0,0,.14);background:var(--cr-card,#FFFFFF);border-radius:8px;font:inherit;font-size:10.5px;font-weight:600;line-height:1;white-space:nowrap;color:var(--cr-muted,rgba(0,0,0.65));cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;}",
        ".cr-jump:hover{border-color:rgba(210,75,54,.45);color:#D24B36;}",
        ".cr-jump.on{background:#D24B36;border-color:#D24B36;color:#FFFFFF;font-weight:700;}",
        ".cr-jump-badge{min-width:13px;height:13px;border-radius:99px;background:#D24B36;color:#FFFFFF;font-size:8px;display:inline-flex;align-items:center;justify-content:center;padding:0 4px;}",
        ".cr-milk-break{margin-top:10px;padding-top:8px;border-top:1px solid var(--cr-line,rgba(0,0,0,.12));}",
        ".cr-seg-bar{display:flex;height:10px;border-radius:99px;overflow:hidden;background:rgba(0,0,0,.08);margin:6px 0;}",
        ".cr-seg-bar i{display:block;height:100%;}",
        ".cr-milk-legend{display:flex;gap:10px;flex-wrap:wrap;font-size:10.5px;color:var(--cr-muted,rgba(0,0,0.62));margin-bottom:4px;}",
        ".cr-milk-legend i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px;vertical-align:middle;}",
        ".cr-daily-events{table-layout:fixed;}",
        ".cr-daily-events .cr-day-row td{background:rgba(210,75,54,.07);font-weight:700;}",
        ".cr-daily-events .cr-subtotal-row td{background:rgba(0,0,0,.035);font-weight:650;border-top:1px solid rgba(0,0,0,.16);}",
        ".cr-mini-grid{display:grid;grid-template-columns:1fr;gap:8px;margin-top:4px;}",
        ".cr-mini-chart{border:1px solid var(--cr-line,rgba(0,0,0,.12));border-radius:10px;padding:6px;background:rgba(0,0,0,.015);min-width:0;}",
        ".cr-mini-title{font-size:10px;font-weight:700;color:var(--cr-muted,rgba(0,0,0.62));margin-bottom:2px;}",
        ".cr-mini-chart .cr-chart{height:92px;margin-top:0;}",
        ".cr-expense-est{margin:6px 0 4px;padding:10px;border-radius:10px;border:1px solid rgba(210,75,54,.20);background:rgba(210,75,54,.05);}",
        ".cr-live-estimate{margin:4px 0 8px;padding:8px;border-radius:10px;border:1px solid rgba(210,75,54,.22);background:rgba(210,75,54,.06);}",
        ".cr-live-estimate .cr-pending-text{font-size:11.5px;line-height:1.5;}",
        ".cr-live-pending{margin:4px 0 8px;padding:8px;border-radius:10px;border:1px solid rgba(210,75,54,.22);background:rgba(210,75,54,.05);}",
        ".cr-live-pending-head{font-size:10.5px;font-weight:700;color:#D24B36;display:flex;justify-content:space-between;margin-bottom:2px;}",
        ".cr-live-pending .cr-pending-row{padding:6px 0;}",
        ".cr-pending{border-color:rgba(210,75,54,.28);}",
        ".cr-pending-row{display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-top:1px solid rgba(0,0,0,.08);}",
        ".cr-pending-row:first-of-type{border-top:0;}",
        ".cr-pending-text{font-size:12px;line-height:1.5;}",
        ".cr-privacy-note{margin-top:12px;padding:10px 11px;border:1px solid rgba(210,75,54,.22);border-radius:11px;background:rgba(210,75,54,.045);font-size:10.5px;line-height:1.6;color:var(--cr-muted,rgba(0,0,0.68));}",
        ".cr-privacy-note b{display:block;color:#D24B36;font-size:11px;margin-bottom:3px;}",
        ".cr-consent{display:flex;gap:7px;align-items:flex-start;margin-top:8px;font-size:11px;font-weight:600;cursor:pointer;}",
        ".cr-consent input{margin-top:2px;accent-color:#D24B36;}",
        ".cr-onboard{padding:18px;max-width:760px;background:var(--cr-card,#FFFFFF);border:1px solid rgba(0,0,0,.12);border-radius:14px;}",
        ".cr-onboard-cancel{flex:0 0 auto;height:24px;padding:0 8px;font-size:10.5px;}",
        ".cr-onboard-hero{display:flex;gap:12px;align-items:center;margin-bottom:12px;}",
        ".cr-onboard-hero h2{font-size:20px;margin:2px 0 4px;line-height:1.25;}",
        ".cr-onboard-hero p{font-size:12px;color:var(--cr-muted,rgba(0,0,0.55));line-height:1.5;margin:0;}",
        ".cr-onboard-kicker{font-size:10.5px;color:#D24B36;font-weight:700;letter-spacing:.04em;}",
        ".cr-steps{display:flex;gap:6px;margin:10px 0 14px;}",
        ".cr-step{width:24px;height:24px;border-radius:50%;border:1px solid rgba(0,0,0,.16);display:inline-flex;align-items:center;justify-content:center;font-size:10px;color:var(--cr-muted,rgba(0,0,0.45));}",
        ".cr-step.on{background:#D24B36;border-color:#D24B36;color:#FFFFFF;}",
        ".cr-onboard-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}",
        ".cr-onboard-option{display:flex;flex-direction:column;align-items:flex-start;gap:2px;border:1px solid rgba(0,0,0,.12);background:var(--cr-card,#FFFFFF);border-radius:12px;padding:10px;text-align:left;font:inherit;cursor:pointer;}",
        ".cr-onboard-option.on{border-color:#D24B36;background:rgba(210,75,54,.07);box-shadow:inset 0 0 0 1px rgba(210,75,54,.35);}",
        ".cr-onboard-option b{font-size:13px;}.cr-onboard-option span{font-size:10.5px;color:var(--cr-muted,rgba(0,0,0.55));}",
        ".cr-onboard-icon{width:24px;height:24px;border-radius:7px;background:rgba(210,75,54,.12);color:#D24B36;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;margin-bottom:2px;}",
        ".cr-onboard-done{text-align:center;padding:18px 8px;}",
        ".cr-onboard-check{width:42px;height:42px;border-radius:50%;background:rgba(210,75,54,.12);color:#D24B36;font-size:22px;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;}",
        ".cr-reminder-empty-line{font-size:10.5px;color:var(--cr-muted,rgba(0,0,0.55));border:1px dashed rgba(0,0,0,.16);border-radius:9px;padding:6px 9px;margin:0 0 10px;}",
        ".cr-quick:hover{border-color:rgba(210,75,54,.45);}",
        ".cr-empty{padding:22px 10px;text-align:center;color:var(--dsw-alias-label-tertiary,rgba(0,0,0,.45));font-size:12px;}",

        // 对话
        "@keyframes cr-pop{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:none;}}",

        // 数字/表
        ".cr-statline{display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:8px;margin-top:10px;}",
        ".cr-stat{background:var(--dsw-alias-bg-layer-3,#FAFAFA);border-radius:11px;padding:8px 10px;}",
        ".cr-stat b{display:block;font-size:15px;font-variant-numeric:tabular-nums;}",
        ".cr-stat span{font-size:10.5px;color:var(--dsw-alias-label-tertiary,rgba(0,0,0,.45));}",
        ".cr-metrics{display:flex;gap:6px;flex-wrap:wrap;}",
        ".cr-choice{display:flex;gap:3px;}",
        ".cr-pill{display:inline-flex;align-items:center;justify-content:center;height:28px;padding:0 10px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));background:var(--dsw-alias-bg-layer-2,#FFFFFF);color:var(--dsw-alias-label-secondary,rgba(0,0,0,.65));border-radius:8px;font:inherit;font-size:11px;font-weight:600;line-height:1;white-space:nowrap;cursor:pointer;}",
        ".cr-pill.on{background:rgba(210,75,54,.12);border-color:rgba(210,75,54,.25);color:#D24B36;font-weight:650;}",
        ".cr-chart{width:100%;height:190px;display:block;margin-top:6px;}",
        ".cr-chart text{fill:var(--dsw-alias-label-tertiary,rgba(0,0,0,.45));font-size:10.5px;font-family:inherit;}",
        ".cr-ref-note{margin-top:7px;padding:7px 9px;border-radius:9px;background:var(--cr-bg,#FAFAFA);border:1px solid rgba(0,0,0,.10);font-size:10.5px;line-height:1.55;color:var(--dsw-alias-label-secondary,rgba(0,0,0,.65));}",
        ".cr-table-wrap{overflow-x:auto;margin-top:6px;}",
        ".cr-table{width:100%;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums;}",
        ".cr-table th{font-weight:600;color:var(--dsw-alias-label-tertiary,rgba(0,0,0,.45));text-align:left;padding:6px 7px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.14));white-space:nowrap;}",
        ".cr-table td{padding:6px 7px;border-bottom:1px solid var(--dsw-alias-border-l1,#FAFAFA);vertical-align:top;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
        ".cr-table tr:last-child td{border-bottom:0;}",
        ".cr-table td.dim{color:var(--dsw-alias-label-tertiary,rgba(0,0,0,.18));}",
        ".cr-table .num{text-align:right;}",
        ".cr-table th.num{text-align:right;}",
        ".cr-table tfoot td{font-weight:700;border-top:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.18));color:var(--dsw-alias-label-primary,#000000);}",
        ".cr-mode{display:flex;gap:6px;margin:2px 0 10px;}",
        ".cr-quick-wrap{margin-bottom:10px;}",
        ".cr-quick-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}",
        ".cr-quick-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}",
        ".cr-quick-top{display:flex;align-items:center;gap:7px;width:100%;}",
        ".cr-quick-icon{width:22px;height:22px;border-radius:7px;background:rgba(210,75,54,.12);color:#D24B36;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex:0 0 auto;}",
        ".cr-quick{display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left;border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.10));background:var(--cr-card,#FFFFFF);border-radius:12px;padding:9px 10px;cursor:pointer;font:inherit;color:inherit;}",
        ".cr-quick:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(210,75,54,.06));border-color:rgba(210,75,54,.25);}",
        ".cr-quick b{font-size:12.5px;}.cr-quick span{font-size:10.5px;color:var(--dsw-alias-label-tertiary,rgba(0,0,0,.45));}",
        ".cr-stage{border-left:3px solid #D24B36;}",
        ".cr-bag-item{display:flex;gap:7px;align-items:flex-start;padding:3px 0;font-size:11px;line-height:1.45;}",
        ".cr-guide-row{display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-top:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.08));}",
        ".cr-guide-index{width:18px;height:18px;border-radius:50%;background:rgba(210,75,54,.12);color:#D24B36;font-size:9px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;margin-top:1px;}",
        ".cr-guide-row:first-of-type{border-top:0;}",
        ".cr-guide-row b{font-size:12px;}",
        ".cr-reminder-row{display:flex;gap:8px;align-items:flex-start;padding:6px 0;border-top:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.08));}",
        ".cr-reminder-row:first-of-type{border-top:0;}",
        ".cr-reminder-dot{width:7px;height:7px;border-radius:50%;background:#D24B36;margin-top:5px;flex:0 0 auto;}",
        ".cr-reminder-title{font-size:12px;font-weight:600;}",
        ".cr-sum-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}",
        ".cr-sum-tile{border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.14));border-radius:12px;padding:8px;background:var(--dsw-alias-bg-layer-2,#FAFAFA);}",
        ".cr-sum-title{font-size:10px;color:var(--dsw-alias-label-tertiary,rgba(0,0,0,.45));}",
        ".cr-sum-value{font-size:16px;font-weight:700;margin:2px 0;}",
        ".cr-sum-note{font-size:9.5px;color:var(--dsw-alias-label-tertiary,rgba(0,0,0,.45));line-height:1.4;}",
        ".cr-sum-tile .cr-chart{height:70px;margin-top:4px;}",
        ".cr-free-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;}",
        ".cr-free-card{border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.14));border-radius:12px;padding:9px;}",
        ".cr-free-card b{font-size:12.5px;}",
        ".cr-free-field{display:flex;gap:6px;margin-bottom:6px;}",
        ".cr-free-field input{flex:1;min-width:0;}",
        ".cr-nutri{margin-top:10px;padding-top:8px;border-top:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.10));}",
        ".cr-nutri-row{display:grid;grid-template-columns:70px 1fr 64px;gap:6px;align-items:center;margin:5px 0;}",
        ".cr-nutri-label{font-size:10.5px;line-height:1.35;}",
        ".cr-nutri-label span{display:block;color:var(--dsw-alias-label-tertiary,rgba(0,0,0,.45));font-size:10px;}",
        ".cr-nutri-bar{height:7px;background:rgba(0,0,0,.08);border-radius:99px;overflow:hidden;}",
        ".cr-nutri-bar i{display:block;height:100%;background:#D24B36;border-radius:99px;}",
        ".cr-nutri-val{font-size:10.5px;text-align:right;color:var(--dsw-alias-label-secondary,rgba(0,0,0,.65));}",
        ".cr-donut{flex:0 0 auto;}.cr-donut-center{font-size:7px;font-weight:700;fill:var(--dsw-alias-label-primary,#000000);}",
        ".cr-vax-donut{display:flex;align-items:center;gap:16px;padding:6px 0;}",
        ".cr-vax-donut-meta{display:flex;flex-direction:column;gap:3px;}",
        ".cr-vax-donut-meta b{font-size:15px;color:#D24B36;}",
        ".cr-vax-donut-meta span{font-size:11px;color:var(--cr-muted,rgba(0,0,0.58));}",
        ".cr-vax-timeline{margin-top:2px;}",
        ".cr-vax-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;}",
        ".cr-vax-tile{border:1px solid rgba(0,0,0,.10);border-radius:10px;padding:7px 8px;background:var(--cr-card,#FFFFFF);}",
        ".cr-vax-tile.done{background:rgba(210,75,54,.05);border-color:rgba(210,75,54,.22);}",
        ".cr-vax-tile-top{display:flex;justify-content:space-between;align-items:baseline;gap:6px;}",
        ".cr-vax-tile-top b{font-size:12px;color:#D24B36;}",
        ".cr-vax-tile-top span{font-size:10px;color:var(--cr-muted,rgba(0,0,0.60));}",
        ".cr-vax-dots{display:flex;gap:3px;margin-top:6px;}",
        ".cr-vax-dot{width:9px;height:9px;border-radius:50%;display:block;border:1px solid rgba(210,75,54,.30);}",
        ".cr-vax-dot.done{background:#D24B36;border-color:#D24B36;}",
        ".cr-vax-dot.alt{background:rgba(210,75,54,.58);border-color:rgba(210,75,54,.58);}",
        ".cr-vax-dot.due{background:rgba(210,75,54,.22);}",
        ".cr-vax-dot.future{background:var(--cr-card,#FFFFFF);}",
        ".cr-vax-visual{display:flex;align-items:center;gap:10px;margin-top:8px;flex-wrap:wrap;}",
        ".cr-vax-visual .cr-legend{flex-direction:column;gap:2px;}",
        ".cr-vax-progress{display:flex;height:9px;border-radius:99px;overflow:hidden;background:rgba(0,0,0,.08);margin-top:10px;}",
        ".cr-vax-progress i{display:block;height:100%;}",
        ".cr-vax-progress .done{background:#D24B36;}.cr-vax-progress .alt{background:rgba(210,75,54,.55);}.cr-vax-progress .due{background:rgba(210,75,54,.30);}",
        ".cr-timeline{position:relative;margin-top:8px;padding-left:4px;}",
        ".cr-timeline-row{display:grid;grid-template-columns:72px 12px 1fr;gap:6px;position:relative;padding:4px 0 8px;}",
        ".cr-timeline-date{font-size:10px;color:var(--dsw-alias-label-tertiary,rgba(0,0,0,.45));padding-top:2px;}",
        ".cr-timeline-dot{width:8px;height:8px;border-radius:50%;background:#D24B36;margin-top:4px;position:relative;z-index:1;}",
        ".cr-timeline-row:not(:last-child):before{content:'';position:absolute;left:77px;top:12px;bottom:-8px;width:1px;background:rgba(0,0,0,.14);}",
        ".cr-timeline-body b{display:block;font-size:12px;line-height:1.45;}",
        ".cr-timeline-body span{font-size:10px;color:var(--dsw-alias-label-tertiary,rgba(0,0,0,.45));}",
        ".cr-vax{font-size:10px;padding:1px 6px;border-radius:99px;display:inline-block;white-space:nowrap;}",
        ".cr-vax.done{background:rgba(0,0,0,.06);color:var(--cr-text,#000000);}",
        ".cr-vax.due{background:rgba(210,75,54,.14);color:#D24B36;}",
        ".cr-vax.alt{background:rgba(210,75,54,.10);color:var(--cr-text,#000000);}",
        ".cr-vax.future{background:var(--cr-bg,#FAFAFA);color:var(--cr-muted,rgba(0,0,0.45));}",
        ".cr-stage-chip{display:inline-block;margin-left:6px;padding:1px 6px;border-radius:99px;background:rgba(0,0,0,.06);color:var(--cr-text,#000000);font-size:9.5px;font-weight:600;vertical-align:middle;}",
        ".cr-live .cr-recent-item:first-of-type{animation:cr-pop .28s ease-out;}",
        ".cr-live .cr-recent-item:first-of-type .cr-recent-dot{box-shadow:0 0 0 3px rgba(210,75,54,.12);}",
        ".cr-chip.dev{background:rgba(210,75,54,.14);color:#D24B36;border-color:rgba(210,75,54,.28);font-size:9px;padding:1px 5px;border-radius:99px;vertical-align:middle;}",
        ".cr-legend{display:flex;gap:10px;flex-wrap:wrap;font-size:10.5px;color:var(--dsw-alias-label-tertiary,rgba(0,0,0,.45));margin-top:2px;}",
        ".cr-legend i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px;vertical-align:middle;}",
        ".cr-estimate{border-color:var(--cr-muted,rgba(0,0,0.16));background:var(--cr-card,#FFFFFF);}",

        // 浮层/表单
        ".cr-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:flex-end;justify-content:center;z-index:9999;}",
        ".cr-sheet{width:min(520px,100%);background:var(--cr-card,#FFFFFF);border-radius:18px 18px 0 0;padding:18px 20px 24px;max-height:86vh;overflow:auto;}",
        ".cr-sheet h3{margin:0 0 14px;font-size:16px;}",
        ".cr-field{margin-bottom:11px;}",
        ".cr-field label{display:block;font-size:12px;color:var(--dsw-alias-label-secondary,rgba(0,0,0,.65));margin-bottom:5px;}",
        ".cr-field input,.cr-field textarea,.cr-field select{width:100%;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));background:var(--dsw-alias-bg-layer-2,#FFFFFF);color:inherit;border-radius:10px;padding:9px 11px;font:inherit;font-size:13px;outline:none;}",
        ".cr-field textarea{min-height:76px;resize:vertical;}",
        ".cr-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#000000;color:#FFFFFF;font-size:12px;padding:9px 14px;border-radius:10px;z-index:10000;}",
        ".cr-chips{display:flex;gap:7px;flex-wrap:wrap;}",
        "@media(max-width:760px){.cr-hero{grid-template-columns:1fr;}.cr-recent{max-height:none;}.cr-chat-log{height:250px;}}",
        "@media(max-width:640px){.cr-root{padding:14px 12px 30px;}.cr-chat-log{height:250px;}}",
        // ── 对齐/网格规范 ──
        ".cr-panel-top{flex-wrap:nowrap;align-items:center;gap:10px;}",
        ".cr-panel-top .cr-who{min-width:0;flex:1 1 auto;}",
        ".cr-panel-top .cr-who > span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
        ".cr-name-row{display:flex;align-items:center;gap:4px;min-width:0;flex-wrap:nowrap;}",
        ".cr-name-row b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}",
        ".cr-name-row .cr-chip,.cr-name-row .cr-stage-chip{flex:0 0 auto;margin-left:0;}",
        ".cr-sec{flex-wrap:nowrap;align-items:center;gap:8px;white-space:nowrap;overflow:hidden;}",
        ".cr-sec > .cr-metrics{flex:0 0 auto;flex-wrap:nowrap;}",
        ".cr-metrics{flex-wrap:nowrap;align-items:center;}",
        ".cr-quick-head{flex-wrap:nowrap;}",
        // ── UI 规范层：卡片/描边/间距只用一套 token ──
        ".cr-panel{--cr-card-bg:#FFFFFF;--cr-line:rgba(0,0,0,.12);--cr-card-radius:14px;--cr-card-pad:14px;--cr-sub-radius:12px;--cr-sub-pad:10px;--cr-gap:12px;}",
        ".cr-group{margin:2px 0 0;}",
        ".cr-group-title{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--cr-muted,rgba(0,0,0.62));letter-spacing:.04em;margin:2px 0 7px;padding-left:14px;white-space:nowrap;}",
        ".cr-group-title:before{content:'';width:4px;height:4px;border-radius:50%;background:#D24B36;flex:0 0 auto;}",
        ".cr-group > .cr-card{margin-bottom:12px;}",
        ".cr-panel .cr-card,.cr-card{background:var(--cr-card-bg,#FFFFFF);border:1px solid var(--cr-line,rgba(0,0,0,.12));border-radius:var(--cr-card-radius,14px);padding:var(--cr-card-pad,14px);margin-bottom:var(--cr-gap,12px);}",
        ".cr-card .cr-sec:first-child,.cr-card > .cr-sec:first-child{margin-top:0;}",
        ".cr-sum-tile,.cr-free-card,.cr-onboard-option,.cr-quick{border:1px solid var(--cr-line,rgba(0,0,0,.12));border-radius:var(--cr-sub-radius,12px);}",
        ".cr-sum-tile,.cr-free-card,.cr-onboard-option{padding:var(--cr-sub-pad,10px);}",
        ".cr-quick{padding:var(--cr-sub-pad,10px);}",
        ".cr-sum-grid,.cr-free-grid,.cr-quick-grid{gap:8px;}",
        ".cr-live-pending,.cr-live-estimate,.cr-ref-note,.cr-estimate{border:1px solid var(--cr-line,rgba(0,0,0,.12));border-radius:10px;}",
        ".cr-stage{border-left:0;}",
        ".cr-recent{border:1px solid var(--cr-line,rgba(0,0,0,.12));}",
        ".cr-pending{border:1px solid var(--cr-line,rgba(0,0,0,.12));}",
        ".cr-field input,.cr-field textarea,.cr-field select{border-color:var(--cr-line,rgba(0,0,0,.12));}",
        ".cr-btn,.cr-pill,.cr-jump{border-color:var(--cr-line,rgba(0,0,0,.12));border-radius:8px;}",
        ".cr-btn.primary,.cr-pill.on,.cr-jump.on{border-color:#D24B36;}",
        ".cr-table th,.cr-table td,.cr-recent-item,.cr-guide-row,.cr-reminder-row{border-color:var(--cr-line,rgba(0,0,0,.12));}",
        ".cr-sec{border-bottom-color:var(--cr-line,rgba(0,0,0,.12));}",
        ".cr-timeline-row:not(:last-child):before{background:var(--cr-line,rgba(0,0,0,.12));}",
        "body[data-ds-dark-theme] .cr-panel .cr-card,body[data-ds-dark-theme] .cr-panel .cr-summary,body[data-ds-dark-theme] .cr-panel .cr-recent,body[data-ds-dark-theme] .cr-panel .cr-sum-tile,body[data-ds-dark-theme] .cr-panel .cr-entry-hero,body[data-ds-dark-theme] .cr-panel .cr-onboard{background:var(--cr-card)!important;border-color:var(--cr-line)!important;color:var(--cr-text)!important;}",
        "body[data-ds-dark-theme] .cr-panel .cr-recent-stat,body[data-ds-dark-theme] .cr-panel .cr-mini-chart,body[data-ds-dark-theme] .cr-panel .cr-entry-workspace,body[data-ds-dark-theme] .cr-panel .cr-onboard-option{background:var(--cr-card2)!important;border-color:var(--cr-line)!important;color:var(--cr-text)!important;}",
        "body[data-ds-dark-theme] .cr-panel .cr-sec,body[data-ds-dark-theme] .cr-panel .cr-table th,body[data-ds-dark-theme] .cr-panel .cr-table td,body[data-ds-dark-theme] .cr-panel .cr-recent-item,body[data-ds-dark-theme] .cr-panel .cr-pending-row,body[data-ds-dark-theme] .cr-panel .cr-guide-row,body[data-ds-dark-theme] .cr-panel .cr-reminder-row{border-color:var(--cr-line)!important;}",
        "body[data-ds-dark-theme] .cr-panel .cr-mut,body[data-ds-dark-theme] .cr-panel .cr-p,body[data-ds-dark-theme] .cr-panel .cr-who span,body[data-ds-dark-theme] .cr-panel .cr-onboard-hero p,body[data-ds-dark-theme] .cr-panel .cr-onboard-option span,body[data-ds-dark-theme] .cr-panel .cr-reminder-empty-line,body[data-ds-dark-theme] .cr-panel .cr-entry-workspace-label{color:var(--cr-muted)!important;}",
        "body[data-ds-dark-theme] .cr-panel .cr-entry,body[data-ds-dark-theme] .cr-panel .cr-launch-page,body[data-ds-dark-theme] .cr-panel .cr-jumps,body[data-ds-dark-theme] .cr-panel .cr-summary,body[data-ds-dark-theme] .cr-panel .cr-panel-top{background:var(--cr-bg)!important;}",
        "body[data-ds-dark-theme] .cr-panel .cr-jump,body[data-ds-dark-theme] .cr-panel .cr-btn,body[data-ds-dark-theme] .cr-panel .cr-pill,body[data-ds-dark-theme] .cr-panel .cr-sum-tile{background:var(--cr-card)!important;color:var(--cr-text)!important;border-color:var(--cr-line)!important;}",
        "body[data-ds-dark-theme] .cr-panel .cr-btn.primary,body[data-ds-dark-theme] .cr-panel .cr-pill.on,body[data-ds-dark-theme] .cr-panel .cr-jump.on{background:#D24B36!important;color:#FFFFFF!important;border-color:#D24B36!important;}",
        "body[data-ds-dark-theme] .cr-panel .cr-jump.on,body[data-ds-dark-theme] .cr-panel .cr-pill.on{background:rgba(210,75,54,.18)!important;color:#F08A75!important;border-color:rgba(210,75,54,.5)!important;}",
        "body[data-ds-dark-theme] .cr-panel .cr-field input,body[data-ds-dark-theme] .cr-panel .cr-field textarea,body[data-ds-dark-theme] .cr-panel .cr-field select,body[data-ds-dark-theme] .cr-panel .cr-entry-workspace-input,body[data-ds-dark-theme] .cr-panel input,body[data-ds-dark-theme] .cr-panel textarea,body[data-ds-dark-theme] .cr-panel select{background:var(--cr-input)!important;color:var(--cr-text)!important;border-color:var(--cr-line)!important;}",
        "body[data-ds-dark-theme] .cr-panel .cr-table th,body[data-ds-dark-theme] .cr-panel .cr-table td,body[data-ds-dark-theme] .cr-panel .cr-table{color:var(--cr-text)!important;}",
        "body[data-ds-dark-theme],body[data-ds-dark-theme].cr-in-workspace{background:#151517!important;color:#ECECEC!important;}","body[data-ds-dark-theme] [data-slot=\"main.conversation\"],body[data-ds-dark-theme] [data-slot=\"main\"]:has([data-conversation-content]),body[data-ds-dark-theme] [data-conversation-content]{background:#151517!important;color:#ECECEC!important;}","body[data-ds-dark-theme] .cr-panel .cr-missing,body[data-ds-dark-theme] .cr-panel .cr-todo-item,body[data-ds-dark-theme] .cr-panel .cr-time-note,body[data-ds-dark-theme] .cr-panel .cr-time-stage,body[data-ds-dark-theme] .cr-panel .cr-time-tip,body[data-ds-dark-theme] .cr-panel .cr-guide-row,body[data-ds-dark-theme] .cr-panel .cr-reminder-row,body[data-ds-dark-theme] .cr-panel .cr-pending-row,body[data-ds-dark-theme] .cr-panel .cr-entry-item{color:var(--cr-text)!important;}","body[data-ds-dark-theme] .cr-panel .cr-missing{background:var(--cr-card2)!important;border-color:var(--cr-line)!important;}","body[data-ds-dark-theme] .cr-panel .cr-missing span,body[data-ds-dark-theme] .cr-panel .cr-time-note i,body[data-ds-dark-theme] .cr-panel .cr-time-stage span,body[data-ds-dark-theme] .cr-panel .cr-recent-stat span,body[data-ds-dark-theme] .cr-panel .cr-todo-actions .cr-btn{color:var(--cr-muted)!important;}","body[data-ds-dark-theme] .cr-panel .cr-todo-check,body[data-ds-dark-theme] .cr-panel .cr-todo-dot{border-color:var(--cr-line)!important;}","body[data-ds-dark-theme] .cr-panel .cr-time-note,body[data-ds-dark-theme] .cr-panel .cr-time-stage{border-color:var(--cr-line-soft)!important;}","body[data-ds-dark-theme] .cr-panel .cr-todo-text,body[data-ds-dark-theme] .cr-panel .cr-time-stage b{color:var(--cr-text)!important;}","body[data-ds-dark-theme] .cr-entry,body[data-ds-dark-theme] .cr-launch-page{background:#151517!important;color:#ECECEC!important;}","body[data-ds-dark-theme] .cr-entry-hero,body[data-ds-dark-theme] .cr-entry-workspace,body[data-ds-dark-theme] .cr-entry-panel,body[data-ds-dark-theme] .cr-entry-action-card,body[data-ds-dark-theme] .cr-entry-item,body[data-ds-dark-theme] .cr-entry-mode-card,body[data-ds-dark-theme] .cr-entry-btn,body[data-ds-dark-theme] .cr-onboard,body[data-ds-dark-theme] .cr-onboard-option{background:#1E1E22!important;border-color:rgba(255,255,255,.16)!important;color:#ECECEC!important;}","body[data-ds-dark-theme] .cr-entry-hero p,body[data-ds-dark-theme] .cr-entry-desc,body[data-ds-dark-theme] .cr-entry-workspace-label,body[data-ds-dark-theme] .cr-entry-workspace-note,body[data-ds-dark-theme] .cr-entry-msg,body[data-ds-dark-theme] .cr-entry-btn-desc,body[data-ds-dark-theme] .cr-onboard-hero p,body[data-ds-dark-theme] .cr-onboard-option span{color:rgba(255,255,255,.62)!important;}","body[data-ds-dark-theme] .cr-entry-workspace-input,body[data-ds-dark-theme] .cr-entry input,body[data-ds-dark-theme] .cr-entry select{background:#26262B!important;color:#ECECEC!important;border-color:rgba(255,255,255,.16)!important;}","body[data-ds-dark-theme] .cr-entry .cr-chip,body[data-ds-dark-theme] .cr-entry-features .cr-chip{background:rgba(210,75,54,.18)!important;color:#F08A75!important;}","body[data-ds-dark-theme] .cr-entry-features span{background:rgba(210,75,54,.18)!important;color:#F08A75!important;border-color:rgba(210,75,54,.35)!important;}","body[data-ds-dark-theme] .cr-entry-buttons .cr-entry-btn:not(.primary){background:#1E1E22!important;border-color:rgba(255,255,255,.16)!important;color:#ECECEC!important;}","body[data-ds-dark-theme] .cr-entry-btn-desc,body[data-ds-dark-theme] .cr-entry-desc,body[data-ds-dark-theme] .cr-entry-workspace-note,body[data-ds-dark-theme] .cr-entry-msg{color:rgba(255,255,255,.62)!important;}","body[data-ds-dark-theme] .cr-entry-btn-icon{color:#F08A75!important;}","body[data-ds-dark-theme] .cr-entry-btn.primary{background:#D24B36!important;border-color:#D24B36!important;color:#FFF!important;}","body[data-ds-dark-theme] .cr-panel .cr-chart text{fill:var(--cr-muted)!important;}",
        "body[data-ds-dark-theme] .cr-panel .cr-chart line{stroke:var(--cr-line)!important;}",
        "body[data-ds-dark-theme] .cr-panel .cr-chart path{stroke:var(--cr-line)!important;}",
        "body[data-ds-dark-theme] .cr-panel .cr-toast{background:#26262B!important;color:#ECECEC!important;border-color:rgba(255,255,255,.16)!important;}",
        ".cr-panel .cr-card{background:var(--cr-card,#FFFFFF)!important;border:1px solid var(--cr-line,rgba(0,0,0,.12))!important;}",
        ".cr-panel .cr-key-card,.cr-panel .cr-sum-tile,.cr-panel .cr-mini-chart,.cr-panel .cr-quick,.cr-panel .cr-free-card,.cr-panel .cr-recent-stat,.cr-panel .cr-missing{background:var(--cr-card2,#FAFAFA)!important;border:1px solid var(--cr-line,rgba(0,0,0,.12))!important;border-radius:12px!important;}",
        ".cr-panel .cr-key-card{border-radius:12px!important;}",
        ".cr-panel .cr-key-bars{border-bottom:1px solid var(--cr-line,rgba(0,0,0,.12))!important;}",
        ".cr-panel .cr-recent{background:var(--cr-card,#FFFFFF)!important;border:1px solid var(--cr-line,rgba(0,0,0,.12))!important;}",
        ".cr-panel .cr-sec{border-bottom-color:var(--cr-line,rgba(0,0,0,.12))!important;}",
        ".cr-panel .cr-table th,.cr-panel .cr-table td{border-bottom-color:var(--cr-line-soft,rgba(0,0,0,.08))!important;}",
      ].join("\n");
      document.head.appendChild(tag);
    }

    // ── API ──
    async function api(path, options) {
      const res = await fetch(BASE + path, { cache: "no-store", ...(options || {}) });
      return res.json();
    }
    // ── 语言层 ──────────────────────────────────────────────────────────────
    // key 直接使用中文源文案，en 里提供英文；新文案只要加一条即可被 tr() 使用。
    // 其他语言可以在 CR_UI_DICTS 里增加，例如 ja / fr。
    const CR_LOCALE_NS = "child-raise";
    // 暂时只保留语言层结构：插件内英文尚未完成，UI 强制保持中文。
    const CR_UI_I18N_READY = false;
    const CR_UI_EN = {
      "问问": "Ask & Grow",
      "带档案的育儿搭档。孕期、成长、喂养、睡眠、健康和花费，都记在同一个孩子档案里。": "A parenting companion with a real archive: pregnancy, growth, feeding, sleep, health and expenses in one child's file.",
      "孕期到 3 岁": "Pregnancy to age 3",
      "日常 / 睡眠": "Daily / sleep",
      "生长 / 疫苗": "Growth / vaccines",
      "花费 / 补剂": "Expenses / supplements",
      "可迁移旧数据": "Import old records",
      "默认工作目录": "Default workspace",
      "选择目录，不改就用预设": "Choose a folder, or keep the default",
      "选择…": "Choose…",
      "保存": "Save",
      "保存时把已有档案一起迁到新目录": "Move existing archives to the new folder",
      "插件只认一个总工作区；下面列出的是总工作区里的档案子工作区。点哪个子目录，就打开哪个档案。": "One root workspace. Each row below is a child's workspace; open a row to switch to that child.",
      "创建新档案": "Create archive",
      "孕期、0–3 岁或自由模式": "Pregnancy, ages 0–3, or free mode",
      "选择档案": "Choose archive",
      "还没有档案": "No archives yet",
      "打开并延续上次会话": "Open the latest conversation",
      "开发模式": "Developer mode",
      "已开启 · 更高权限": "On · higher permissions",
      "关闭 · 点击开启": "Off · click to enable",
      "虚拟模式": "Virtual mode",
      "待开发": "Coming later",
      "档案子工作区": "Archives",
      "开对话": "Open chat",
      "总汇总": "Summary",
      "刷新": "Refresh",
      "返回": "Back",
      "全家": "Family",
      "全部": "All",
      "日常": "Daily",
      "花费": "Expenses",
      "生长": "Growth",
      "疫苗": "Vaccines",
      "里程": "Milestones",
      "补剂": "Supplements",
      "阶段": "Stage",
      "孕期": "Pregnancy",
      "备孕": "Preparing",
      "表单": "Forms",
      "实时更新": "Recent updates",
      "关键指标": "Key metrics",
      "待办": "To do",
      "到点注意": "Due today",
      "记一笔": "Add record",
      "更多": "More",
      "全部数据汇总": "All data summary",
      "全部记录 · 图表只读 Markdown": "All records · charts read Markdown only",
      "导出总汇总": "Export summary",
      "档案还缺": "Archive missing",
      "在对话里补": "Add in chat",
      "全部记录 · 水": "All records · water",
      "近 7 天按有记录天平均 · 按天": "7-day average over recorded days",
      "汇总口径：日常/奶/睡眠/生长/疫苗为当前档案的全部记录；营养为近 7 天有记录天平均。数据只读自 Markdown，不额外生成事实。": "Scope: daily/milk/sleep/growth/vaccines use all records in this archive; nutrition uses the last 7 recorded days. Data is read from Markdown only.",
      "正在打开问问…": "Opening Ask & Grow…",
    };
    const CR_UI_DICTS = { en: CR_UI_EN };
    let CR_LOCALE_SERVICE = null;
    function installClientLocale(ctx) {
      try {
        const locale = ctx && typeof ctx.get === "function" ? ctx.get("locale") : undefined;
        if (!locale || typeof locale.register !== "function") return;
        try { locale.register(CR_LOCALE_NS, CR_UI_DICTS); } catch { /* already registered during HMR */ }
        CR_LOCALE_SERVICE = locale;
      } catch { /* optional */ }
    }
    function tr(text, params) {
      if (!CR_UI_I18N_READY || !text || !CR_LOCALE_SERVICE) return text;
      try { return CR_LOCALE_SERVICE.bind(CR_LOCALE_NS)(text, params) || text; } catch { return text; }
    }
    function useLocaleVersion() {
      const [version, setVersion] = useState(0);
      useEffect(() => {
        const locale = pluginCtx && typeof pluginCtx.get === "function" ? pluginCtx.get("locale") : null;
        if (!locale || typeof locale.subscribe !== "function") return undefined;
        let off;
        try { off = locale.subscribe(() => setVersion((x) => x + 1)); } catch { /* ignore */ }
        return () => { try { if (typeof off === "function") off(); } catch { /* ignore */ } };
      }, []);
      return version;
    }
    let pluginWorkspace = "";
    let pluginCtx = null;
    const onboardKey = (ws) => "cr-onboarding-dismissed:" + String(ws || "");
    const setOnboardDismissed = (ws, yes) => {
      try {
        if (yes) localStorage.setItem(onboardKey(ws), "1");
        else localStorage.removeItem(onboardKey(ws));
      } catch { /* ignore */ }
    };
    const repairSessions = () => fetch(BASE + "/workspace/repair-sessions", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }).catch(() => null);
    const cleanupWorkspaces = () => fetch(BASE + "/workspace/cleanup", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }).catch(() => null);
    const loadStatus = () => api("/status").then((s) => {
      if (s && s.workspace) pluginWorkspace = String(s.workspace);
      setTimeout(syncConversationBg, 0);
      return s;
    });

    function syncConversationBg() {
      try {
        if (!pluginWorkspace) loadStatus().catch(() => {});
        const content = document.querySelector("[data-conversation-content]");
        const host = content && content.parentElement;
        if (!host) return;
        const sid = content.getAttribute("data-conversation-session") || "";
        const sessions = pluginCtx.get("sessions");
        const snap = sessions && sessions.list && sessions.list.getSnapshot ? sessions.list.getSnapshot() : null;
        const cwd = String((snap && snap.byId && snap.byId[sid] && snap.byId[sid].cwd) || "");
        const base = pluginWorkspace.replace(/\/+$/, "");
        const under = !!base && (cwd === base || cwd.startsWith(base + "/"));
        document.documentElement.dataset.crWorkspace = under ? "1" : "";
        document.body.classList.toggle("cr-in-workspace", under);
        host.classList.toggle("cr-workspace-bg", under);
        if (under) {
          const dark = document.body.hasAttribute("data-ds-dark-theme") || String(document.documentElement.style.colorScheme || "").includes("dark");
          host.style.setProperty("background-color", dark ? "#151517" : "#FAFAFA", "important");
        } else host.style.removeProperty("background-color");
      } catch { /* best effort */ }
    }
    if (typeof window !== "undefined") setInterval(syncConversationBg, 900);
    const OVERVIEW_ETAGS = new Map();
    async function loadOverview(childId) {
      const key = String(childId || "");
      const headers = OVERVIEW_ETAGS.get(key) ? { "if-none-match": OVERVIEW_ETAGS.get(key) } : undefined;
      const res = await fetch(BASE + "/overview?child=" + encodeURIComponent(childId), { cache: "no-store", headers });
      if (res.status === 304) return { ok: true, notModified: true };
      const data = await res.json();
      const etag = res.headers.get("etag");
      if (etag) OVERVIEW_ETAGS.set(key, etag);
      return data;
    }
    const loadUpdates = (childId, after) => api("/updates?child=" + encodeURIComponent(childId) + "&after=" + after);
    const routineSuggest = (childId) => api("/routine/suggest", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId }),
    });
    const routineConfirm = (childId, action, extra = {}) => api("/routine/confirm", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId, action, values: extra.values, from: extra.from }),
    });
    const loadReminders = () => api("/reminders");
    const deleteReminder = (id) => api("/reminder/delete", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }),
    });
    const postReminder = (childId, payload) => api("/reminder", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId, ...payload }),
    });
    const customForms = (childId) => api("/custom/forms?child=" + encodeURIComponent(childId));
    const createCustomForm = (childId, payload) => api("/custom/forms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId, ...payload }) });
    const customRecords = (childId, formId) => api("/custom/records?child=" + encodeURIComponent(childId) + "&formId=" + encodeURIComponent(formId));
    const postCustomRecord = (childId, formId, values) => api("/custom/records", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId, formId, values }) });
    const postWrite = (childId, kind, payload) => api("/write", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ childId, kind, payload }),
    });

    // ── 内嵌对话：在插件面板里直接跑一个 DSH 会话，不跳走 ──
    const PREGNANCY_MILESTONES = [
      { start: 11, end: 13, title: "NT 检查", note: "11–13+6 周；按医生安排" },
      { start: 15, end: 20, title: "唐筛 / 无创", note: "15–20 周；按医生安排" },
      { start: 20, end: 24, title: "大排畸", note: "20–24 周；按医生安排" },
      { start: 24, end: 28, title: "糖耐", note: "24–28 周；按医生安排" },
      { start: 28, end: 36, title: "每 2 周产检", note: "28–36 周；按医生安排" },
      { start: 36, end: 40, title: "每周产检 / 胎心监护", note: "36 周后；按医生安排" },
    ];

    function pregnancyDate(dueDate, week) {
      if (!dueDate || !Number.isFinite(Number(week))) return "";
      const d = new Date(String(dueDate) + "T00:00:00Z");
      if (Number.isNaN(d.getTime())) return "";
      d.setUTCDate(d.getUTCDate() - (280 - Number(week) * 7));
      return d.toISOString().slice(0, 10);
    }

    const HISTORY_SECTIONS = ["stage", "free", "expense", "personality", "growth", "daily", "nutrition", "vaccine", "checkup", "milestone", "specialSupplement", "medication", "assessment", "preconception", "pregnancy"];

    const STAGE_SECTIONS = {
      preconception: ["stage", "expense", "preconception"],
      pregnancy: ["stage", "expense", "pregnancy"],
      newborn: ["stage", "expense", "personality", "growth", "daily", "vaccine", "checkup", "milestone"],
      infant: ["stage", "expense", "personality", "growth", "daily", "vaccine", "checkup", "milestone", "assessment"],
      toddler: ["stage", "expense", "personality", "growth", "daily", "nutrition", "vaccine", "checkup", "milestone", "specialSupplement", "medication", "assessment"],
      preschool: ["stage", "expense", "free"],
      school: ["stage", "expense", "free"],
    };

    const STAGE_ACTIONS = {
      preconception: ["expense", "todo", "cycle", "prepCheckup"],
      pregnancy: ["expense", "todo", "pregnancyBasic", "pregnancyVital", "pregnancyCheckup", "pregnancyReport", "pregnancyMed", "pregnancyMeal"],
      newborn: ["expense", "milkDetail", "supplementDetail", "sleepLog", "todo", "personality", "record", "growth", "vaccine", "checkup", "milestone"],
      infant: ["expense", "milkDetail", "supplementDetail", "sleepLog", "todo", "personality", "record", "food", "supplement", "growth", "vaccine", "checkup", "milestone"],
      toddler: ["expense", "milkDetail", "supplementDetail", "sleepLog", "todo", "personality", "record", "food", "supplement", "growth", "vaccine", "checkup", "milestone", "specialSupplement", "medication"],
      preschool: ["expense", "todo"],
      school: ["expense", "todo"],
    };

    const QUICK_PRIORITY = {
      newborn: ["food", "milkDetail", "sleepLog", "record", "supplement", "growth", "expense", "checkup", "vaccine", "milestone", "specialSupplement", "medication", "personality", "todo"],
      infant: ["food", "milkDetail", "sleepLog", "record", "supplement", "growth", "expense", "checkup", "vaccine", "milestone", "specialSupplement", "medication", "personality", "todo"],
      toddler: ["food", "milkDetail", "sleepLog", "record", "supplement", "growth", "expense", "checkup", "vaccine", "milestone", "specialSupplement", "medication", "personality", "todo"],
      pregnancy: ["pregnancyVital", "pregnancyCheckup", "pregnancyMeal", "pregnancyReport", "pregnancyMed", "pregnancyBasic", "expense", "todo"],
      preconception: ["cycle", "prepCheckup", "expense", "todo"],
      preschool: ["expense", "todo"],
      school: ["expense", "todo"],
    };

    const QUICK = {
      record: { title: "日常", desc: "拉 / 尿 / 水 / 补剂", icon: "记" },
      food: { title: "餐食", desc: "餐食 / 零食 / 饮料 / 水果", icon: "食" },
      supplement: { title: "补剂", desc: "AD / D3 / DHA", icon: "补" },
      growth: { title: "生长", desc: "身高 · 体重（头围随体检）", icon: "长" },
      vaccine: { title: "疫苗", desc: "官方对照 · 分针", icon: "疫" },
      checkup: { title: "体检", desc: "项目 · 结果 · 建议", icon: "检" },
      milestone: { title: "里程碑", desc: "第一次 / 阶段突破", icon: "里" },
      specialSupplement: { title: "特殊补剂", desc: "铁 / 钙 / 益生菌", icon: "特" },
      medication: { title: "用药", desc: "家长填 · 仅记录", icon: "药" },
      personality: { title: "人格 / 偏好", desc: "观察 · 不贴标签", icon: "人" },
      expense: { title: "育儿花费", desc: "记一笔 · 按月汇总", icon: "花" },
      milkDetail: { title: "奶记录", desc: "母乳 / 配方奶 / 水奶 / 牛奶 / 羊奶", icon: "乳" },
      supplementDetail: { title: "补剂成分", desc: "AD/D3/DHA · 成分含量", icon: "补" },
      sleepLog: { title: "睡眠", desc: "入睡 / 醒来 / 夜醒", icon: "睡" },
      todo: { title: "待办", desc: "几点做什么 · 可勾掉", icon: "办" },
      cycle: { title: "周期", desc: "开始 / 长度", icon: "周" },
      prepCheckup: { title: "孕前检查", desc: "项目 · 结果", icon: "检" },
      pregnancyBasic: { title: "孕前体重/身高", desc: "算增重参考", icon: "重" },
      pregnancyVital: { title: "孕期体重血压", desc: "孕周 · 体重 · 血压", icon: "压" },
      pregnancyCheckup: { title: "产检", desc: "孕周 · 项目 · 结果", icon: "检" },
      pregnancyReport: { title: "孕检报告", desc: "NT / 大排畸 / 糖耐", icon: "报" },
      pregnancyMed: { title: "孕期用药/补剂", desc: "医嘱 · 只记录", icon: "药" },
      pregnancyMeal: { title: "孕期饮食", desc: "吃了什么 · 反应", icon: "食" },
    };

    const FORMS = {
      record: {
        title: "日常记录", kind: "record",
        fields: [
          { key: "category", label: "类别", type: "select", options: [["poop", "拉"], ["pee", "尿"], ["water", "水"], ["supplement", "补剂"]], default: "poop" },
          { key: "date", label: "日期", type: "date", default: todayISO() },
          { key: "text", label: "次数 / 量 / 一句话", type: "textarea", placeholder: "150ml / 2 次 / 第一次自己穿鞋…" },
          { key: "time", label: "时间点（可不填）", type: "text", placeholder: "09:00 / 15:00" },
          { key: "note", label: "备注（可不填，性状等细节）", type: "text", placeholder: "性状偏稀 / 喝得急…" },
        ],
        build: (v) => ({ category: v.category || "other", date: v.date, text: v.text, time: v.time, note: v.note }),
      },
      todo: {
        title: "待办", kind: "todoAdd",
        fields: [
          { key: "text", label: "要做什么", type: "text", placeholder: "喂奶 / 预约儿保 / 买尿布" },
          { key: "dueDate", label: "日期", type: "date", default: todayISO() },
          { key: "dueTime", label: "时间", type: "text", placeholder: "14:00" },
          { key: "section", label: "分组（可不填）", type: "text", placeholder: "日程" },
        ],
        build: (v) => ({ text: v.text, dueDate: v.dueDate, dueTime: v.dueTime, section: v.section || "日程" }),
        validate: (v) => (v.text ? "" : "写一下要做什么"),
      },
      sleepLog: {
        title: "睡眠记录", kind: "sleepLog",
        fields: [
          { key: "date", label: "日期", type: "date", default: todayISO() },
          { key: "sleepType", label: "类型", type: "select", options: [["夜间", "夜间睡眠"], ["午睡", "午睡"]], default: "夜间" },
          { key: "sleepStart", label: "入睡", type: "text", placeholder: "21:30" },
          { key: "sleepEnd", label: "醒来", type: "text", placeholder: "07:00" },
          { key: "duration", label: "时长（分钟，可不填自动算）", type: "number", placeholder: "0" },
          { key: "nightWakes", label: "夜醒次数", type: "number", placeholder: "0" },
          { key: "note", label: "备注（可不填）", type: "text" },
        ],
        build: (v) => ({ date: v.date, sleepType: v.sleepType || "夜间", sleepStart: v.sleepStart, sleepEnd: v.sleepEnd, duration: Number(v.duration) || sleepMinutes(v.sleepStart, v.sleepEnd), nightWakes: Number(v.nightWakes) || 0, note: v.note }),
        validate: (v) => ((v.sleepStart && v.sleepEnd) || Number(v.duration) > 0 ? "" : "填入睡/醒来，或直接填时长"),
      },
      supplementDetail: {
        title: "补剂成分", kind: "supplementDetail",
        fields: [
          { key: "date", label: "日期", type: "date", default: todayISO() },
          { key: "time", label: "时间（可不填）", type: "text", placeholder: "08:00" },
          { key: "name", label: "名称", type: "text", placeholder: "AD / D3 / DHA / 铁剂" },
          { key: "amount", label: "数量", type: "number", placeholder: "1" },
          { key: "unit", label: "单位", type: "text", placeholder: "粒 / ml / 滴" },
          { key: "ingredients", label: "成分含量（按包装填）", type: "textarea", placeholder: "维生素A 1500IU、维生素D 400IU" },
          { key: "note", label: "备注（可不填）", type: "text" },
        ],
        build: (v) => ({ date: v.date, text: v.name, name: v.name, amount: Number(v.amount) || 0, unit: v.unit, ingredients: v.ingredients, time: v.time, note: v.note }),
        validate: (v) => (v.name ? "" : "写一下补剂名称"),
      },
      milkDetail: {
        title: "奶记录", kind: "milkDetail",
        note: "所有奶都记这里：先选品种，再填品牌/段数、量和标签营养；母乳/水奶/牛奶/羊奶不需要标签也能记。",
        fields: [
          { key: "date", label: "日期", type: "date", default: todayISO() },
          { key: "milkType", label: "品种", type: "select", options: [["母乳", "母乳"], ["配方奶", "配方奶"], ["水奶", "水奶"], ["牛奶", "牛奶"], ["羊奶", "羊奶"], ["混合", "混合"], ["其他", "其他"]], default: "母乳" },
          { key: "brand", label: "品牌/段数（可不填）", type: "text", placeholder: "A2 紫白金 3 段 / 鲜牛奶" },
          { key: "amount", label: "量（ml）", type: "number", placeholder: "120" },
          { key: "time", label: "时间（可不填）", type: "text", placeholder: "09:00" },
          { key: "label", label: "标签营养（每 100ml，可不填）", type: "text", placeholder: "能量 293kJ、蛋白 2.7g、钙 104mg" },
          { key: "estimate", label: "估算摄入（可不填）", type: "text", placeholder: "约 400kcal / 蛋白 15g" },
          { key: "note", label: "备注（可不填）", type: "text" },
        ],
        build: (v) => ({ date: v.date, text: v.milkType, milkType: v.milkType || "其他", brand: v.brand, amount: Number(v.amount) || 0, time: v.time, label: v.label, estimate: v.estimate, note: v.note }),
        validate: (v) => (Number(v.amount) > 0 ? "" : "奶量要大于 0"),
      },
      expense: {
        title: "育儿花费", kind: "expense",
        fields: [
          { key: "date", label: "日期", type: "date", default: todayISO() },
          { key: "expenseCategory", label: "类别", type: "select", options: [["奶粉", "奶粉"], ["尿布", "尿布"], ["辅食", "餐食"], ["零食", "零食"], ["饮料", "饮料"], ["水果", "水果"], ["医疗", "医疗"], ["教育", "教育"], ["衣物", "衣物"], ["玩具", "玩具"], ["出行", "出行"], ["孕期", "孕期"], ["其他", "其他"]], default: "奶粉" },
          { key: "item", label: "项目", type: "text", placeholder: "奶粉 2 罐 / 尿布 1 包 / 产检" },
          { key: "product", label: "商品名（有就填，方便查市场价）", type: "text", placeholder: "爱他美卓萃 2 段 / 帮宝适 L" },
          { key: "amount", label: "金额（元）", type: "number", placeholder: "0" },
          { key: "payer", label: "支付人（可不填）", type: "text", placeholder: "妈妈 / 爸爸 / 外婆" },
          { key: "note", label: "备注（可不填）", type: "text" },
        ],
        build: (v) => ({ date: v.date, text: v.item, item: v.item, product: v.product, expenseCategory: v.expenseCategory || "其他", amount: Number(v.amount) || 0, payer: v.payer, note: v.note }),
        validate: (v) => (v.item ? (Number(v.amount) > 0 ? "" : "金额要大于 0") : "写一下买了什么"),
      },
      food: {
        title: "餐食记录", kind: "food",
        note: "只写具体食物/食材，不写“午饭/晚饭”。有包装/营养表就拍给对话，能按标签算；只有食物名也能按常见儿童份量粗估。",
        fields: [
          { key: "date", label: "日期", type: "date", default: todayISO() },
          { key: "time", label: "时间（可不填）", type: "text", placeholder: "12:00" },
          { key: "foodType", label: "类型", type: "select", options: [["辅食", "餐食"], ["零食", "零食"], ["饮料", "饮料"], ["水果", "水果"]], default: "辅食" },
          { key: "food", label: "具体食物 / 食材", type: "text", placeholder: "米饭、排骨、西兰花（不写午饭）" },
          { key: "quantity", label: "份量", type: "text", placeholder: "50g / 1 个 / 200ml" },
          { key: "ingredients", label: "食材与份量（有才填）", type: "textarea", placeholder: "米饭 50g、鸡蛋 1 个、西兰花 30g" },
          { key: "nutrition", label: "营养估算（参考，可不填）", type: "text", placeholder: "约 200–240 kcal / 蛋白质 9g" },
          { key: "reaction", label: "反应（可不填）", type: "text", placeholder: "爱吃 / 不爱吃…" },
          { key: "source", label: "依据（可不填）", type: "text", placeholder: "中国食物成分表 / 产品标签" },
        ],
        build: (v) => ({ date: v.date, time: v.time, text: v.food, foodType: v.foodType, food: v.food, quantity: v.quantity, ingredients: v.ingredients, nutrition: v.nutrition, reaction: v.reaction, source: v.source }),
        validate: (v) => (v.food ? "" : "写一下吃了什么"),
      },
      supplement: {
        title: "补剂（AD / D3 / DHA）", kind: "record",
        fields: [
          { key: "date", label: "日期", type: "date", default: todayISO() },
          { key: "text", label: "吃了什么", type: "text", placeholder: "AD / D3 / DHA" },
          { key: "time", label: "时间（可不填）", type: "text", placeholder: "08:00" },
          { key: "note", label: "备注（可不填）", type: "text" },
        ],
        build: (v) => ({ category: "supplement", date: v.date, text: v.text, time: v.time, note: v.note }),
        validate: (v) => (v.text ? "" : "写一下吃了哪个"),
      },
      specialSupplement: {
        title: "特殊补剂（用户自填）", kind: "specialSupplement",
        fields: [
          { key: "name", label: "名称", type: "text", placeholder: "铁剂 / 钙 / 益生菌…" },
          { key: "product", label: "产品（可不填）", type: "text" },
          { key: "dose", label: "剂量（按医嘱/说明）", type: "text" },
          { key: "frequency", label: "频率", type: "text", placeholder: "每天 / 隔天" },
          { key: "time", label: "时间", type: "text", placeholder: "08:00" },
          { key: "start", label: "开始日期", type: "date" },
          { key: "stop", label: "停用日期（可不填）", type: "date" },
          { key: "source", label: "依据", type: "text", placeholder: "医生 / 说明书" },
        ],
        build: (v) => ({ name: v.name, product: v.product, dose: v.dose, frequency: v.frequency, time: v.time, start: v.start, stop: v.stop, source: v.source }),
        validate: (v) => (v.name ? "" : "写一下名称"),
      },
      medication: {
        title: "用药（用户自填）", kind: "medication",
        fields: [
          { key: "name", label: "药名", type: "text" },
          { key: "dose", label: "剂量（按医嘱）", type: "text" },
          { key: "frequency", label: "频率", type: "text" },
          { key: "time", label: "时间", type: "text" },
          { key: "start", label: "开始日期", type: "date" },
          { key: "stop", label: "结束日期（可不填）", type: "date" },
          { key: "reason", label: "医嘱/原因（可不填）", type: "text" },
          { key: "note", label: "备注（可不填）", type: "text" },
        ],
        build: (v) => ({ name: v.name, dose: v.dose, frequency: v.frequency, time: v.time, start: v.start, stop: v.stop, reason: v.reason, note: v.note }),
        validate: (v) => (v.name ? "" : "写一下药名"),
      },
      checkup: {
        title: "体检记录", kind: "checkup",
        note: "头围只随体检记；身高体重有就填，没有就空着。",
        fields: [
          { key: "date", label: "日期", type: "date", default: todayISO() },
          { key: "item", label: "项目", type: "text", placeholder: "儿保 / 血常规…" },
          { key: "result", label: "结果（用户填）", type: "text" },
          { key: "advice", label: "医生建议（用户填）", type: "text" },
          { key: "height", label: "身高 cm（可不填）", type: "number" },
          { key: "weight", label: "体重 kg（可不填）", type: "number" },
          { key: "head", label: "头围 cm（可不填）", type: "number" },
        ],
        build: (v) => ({ date: v.date, text: v.item, item: v.item, result: v.result, advice: v.advice, height: num(v.height), weight: num(v.weight), head: num(v.head) }),
        validate: (v) => (v.item ? "" : "写一下项目"),
      },
      pregnancyReport: {
        title: "孕检报告归集", kind: "pregnancyReport",
        note: "只存报告摘要/关键指标，不存原图；结论只抄医生原话，不解读。发图给聊天也可以：模型会先跳过姓名/证件/电话/地址等隐私字段，再提取报告数据。",
        fields: [
          { key: "date", label: "日期", type: "date", default: todayISO() },
          { key: "week", label: "孕周", type: "number" },
          { key: "report", label: "报告", type: "text", placeholder: "NT / 大排畸 / 糖耐…" },
          { key: "findings", label: "关键指标/结论（照报告/医生说）", type: "textarea" },
          { key: "advice", label: "医生建议（可不填）", type: "text" },
          { key: "source", label: "来源（可不填）", type: "text", placeholder: "医院/报告" },
        ],
        build: (v) => ({ date: v.date, week: num(v.week), text: v.report, report: v.report, findings: v.findings, advice: v.advice, source: v.source }),
        validate: (v) => (v.report ? "" : "写一下报告名称"),
      },
      pregnancyMed: {
        title: "孕期用药 / 补剂", kind: "pregnancyMed",
        note: "只记医嘱/用户填的；不推荐、不调整剂量。填了时间会建每日提醒。",
        fields: [
          { key: "name", label: "名称", type: "text" },
          { key: "dose", label: "剂量", type: "text" },
          { key: "frequency", label: "频率", type: "text", placeholder: "每天 / 隔天" },
          { key: "time", label: "时间（可不填）", type: "text", placeholder: "08:00" },
          { key: "start", label: "开始日期", type: "date", default: todayISO() },
          { key: "stop", label: "停用日期（可不填）", type: "date" },
          { key: "reason", label: "医嘱/原因（可不填）", type: "text" },
        ],
        build: (v) => ({ name: v.name, text: v.name, dose: v.dose, frequency: v.frequency, time: v.time, start: v.start, stop: v.stop, reason: v.reason }),
        validate: (v) => (v.name ? "" : "写一下名称"),
      },
      pregnancyMeal: {
        title: "孕期饮食记录", kind: "pregnancyMeal",
        fields: [
          { key: "date", label: "日期", type: "date", default: todayISO() },
          { key: "meal", label: "餐次", type: "select", options: [["早餐", "早餐"], ["午餐", "午餐"], ["晚餐", "晚餐"], ["加餐", "加餐"], ["其他", "其他"]] },
          { key: "food", label: "吃了什么", type: "textarea" },
          { key: "note", label: "备注（可不填）", type: "text", placeholder: "反应 / 胃口…" },
        ],
        build: (v) => ({ date: v.date, meal: v.meal, text: v.food, food: v.food, note: v.note }),
        validate: (v) => (v.food ? "" : "写一下吃了什么"),
      },
      bagAdd: {
        title: "待产包加一条", kind: "bagAdd",
        fields: [
          { key: "section", label: "分类", type: "select", options: [["证件/资料", "证件/资料"], ["妈妈", "妈妈"], ["宝宝", "宝宝"], ["其他", "其他"]] },
          { key: "text", label: "要带什么", type: "text" },
        ],
        build: (v) => ({ section: v.section, text: v.text }),
        validate: (v) => (v.text ? "" : "写一下要带什么"),
      },
      pregnancyBasic: {
        title: "孕前体重 / 身高", kind: "pregnancyBasic",
        note: "只用来算孕期增重参考，不诊断；具体目标问产科医生。",
        fields: [
          { key: "preWeight", label: "孕前体重 kg", type: "number" },
          { key: "height", label: "身高 cm", type: "number" },
        ],
        build: (v) => ({ preWeight: num(v.preWeight), height: num(v.height) }),
      },
      hospitalAssessment: {
        title: "医院发育评估", kind: "hospitalAssessment",
        note: "仅记录医院或儿保评估及医生结论，不解读、不诊断。机构名可填写。",
        fields: [
          { key: "date", label: "日期", type: "date", default: todayISO() },
          { key: "months", label: "月龄", type: "number" },
          { key: "institution", label: "医院/儿保机构", type: "text" },
          { key: "tool", label: "评估工具/项目", type: "text", placeholder: "Gesell / 儿保发育评估" },
          { key: "result", label: "结果（医生写的）", type: "textarea" },
          { key: "advice", label: "医生建议（可不填）", type: "text" },
          { key: "note", label: "备注（可不填）", type: "text" },
        ],
        build: (v) => ({ date: v.date, months: num(v.months), text: v.tool, institution: v.institution, tool: v.tool, result: v.result, advice: v.advice, note: v.note }),
        validate: (v) => (v.result ? "" : "写一下结果"),
      },
      personality: {
        title: "人格 / 偏好观察", kind: "personality",
        note: "只写看到的事；一次事件标“低”，稳定偏好标“高/中”。不贴标签、不诊断。",
        fields: [
          { key: "date", label: "日期", type: "date", default: todayISO() },
          { key: "dimension", label: "维度", type: "select", options: [["气质", "气质"], ["喜欢", "喜欢"], ["不喜欢", "不喜欢"], ["安抚", "安抚"], ["社交", "社交"], ["饮食", "饮食"], ["睡眠", "睡眠"], ["语言", "语言"], ["敏感点", "敏感点"], ["变化", "变化"], ["其他", "其他"]] },
          { key: "observation", label: "观察（写行为，不写标签）", type: "textarea", placeholder: "在陌生小区会先站在我腿边，几分钟后才去滑梯" },
          { key: "context", label: "场景 / 依据", type: "text", placeholder: "2026-11-10 下午，第一次去这个小区" },
          { key: "confidence", label: "置信度", type: "select", options: [["高", "高"], ["中", "中"], ["低", "低"]] },
        ],
        build: (v) => ({ date: v.date, dimension: v.dimension, text: v.observation, observation: v.observation, context: v.context, confidence: v.confidence }),
        validate: (v) => (v.observation ? "" : "写一句观察"),
      },
      cycle: {
        title: "周期记录", kind: "cycle",
        fields: [
          { key: "date", label: "开始日期", type: "date", default: todayISO() },
          { key: "end", label: "结束日期（可不填）", type: "date" },
          { key: "length", label: "周期长度（天）", type: "number" },
          { key: "flow", label: "经量（可不填）", type: "text", placeholder: "少 / 中 / 多" },
          { key: "note", label: "备注（可不填）", type: "text" },
        ],
        build: (v) => ({ date: v.date, end: v.end, length: num(v.length), flow: v.flow, note: v.note }),
      },
      prepCheckup: {
        title: "孕前检查", kind: "prepCheckup",
        fields: [
          { key: "date", label: "日期", type: "date", default: todayISO() },
          { key: "item", label: "项目", type: "text" },
          { key: "result", label: "结果（用户填）", type: "text" },
          { key: "advice", label: "建议（用户填）", type: "text" },
        ],
        build: (v) => ({ date: v.date, text: v.item, item: v.item, result: v.result, advice: v.advice }),
        validate: (v) => (v.item ? "" : "写一下项目"),
      },
      pregnancyVital: {
        title: "孕期体重 / 血压", kind: "pregnancyVital",
        fields: [
          { key: "date", label: "日期", type: "date", default: todayISO() },
          { key: "week", label: "孕周", type: "number" },
          { key: "weight", label: "体重 kg", type: "number" },
          { key: "systolic", label: "收缩压", type: "number" },
          { key: "diastolic", label: "舒张压", type: "number" },
          { key: "note", label: "备注（可不填）", type: "text" },
        ],
        build: (v) => ({ date: v.date, week: num(v.week), weight: num(v.weight), systolic: num(v.systolic), diastolic: num(v.diastolic), note: v.note }),
      },
      pregnancyCheckup: {
        title: "产检", kind: "pregnancyCheckup",
        fields: [
          { key: "date", label: "日期", type: "date", default: todayISO() },
          { key: "week", label: "孕周", type: "number" },
          { key: "item", label: "项目", type: "text" },
          { key: "result", label: "结果（用户填）", type: "text" },
          { key: "advice", label: "医生建议（用户填）", type: "text" },
        ],
        build: (v) => ({ date: v.date, week: num(v.week), text: v.item, item: v.item, result: v.result, advice: v.advice }),
        validate: (v) => (v.item ? "" : "写一下项目"),
      },
      growth: {
        title: "生长", kind: "growth",
        note: "参考：WHO 0–5 岁生长标准 P3–P97；中国可对照 WS/T 423—2022。只作参考，不诊断。头围不平时量，随体检一起记。",
        fields: [
          { key: "date", label: "日期", type: "date", default: todayISO() },
          { key: "height", label: "身高 cm", type: "number" },
          { key: "weight", label: "体重 kg", type: "number" },
          { key: "note", label: "备注（可不填）", type: "text" },
        ],
        build: (v) => ({ date: v.date, height: num(v.height), weight: num(v.weight), head: num(v.head), note: v.note }),
        validate: (v) => (num(v.height) || num(v.weight) || num(v.head) ? "" : "填一个数就行"),
      },
      vaccine: {
        title: "疫苗记录", kind: "vaccine",
        note: "官方程序只做对照；具体针次/顺序以接种门诊为准。自费/替代疫苗请用下面的计划表，不要自动套官方针次。",
        fields: [
          { key: "date", label: "接种日期", type: "date", default: todayISO() },
          { key: "name", label: "疫苗名", type: "text", placeholder: "麻腮风 / 五联 / 13 价肺炎…" },
          { key: "dose", label: "第几针", type: "text", placeholder: "1 / 2 / 3" },
          { key: "months", label: "接种时月龄（补记用）", type: "number" },
        ],
        build: (v) => ({ date: v.date, text: v.name, dose: v.dose, months: num(v.months) }),
        validate: (v) => (v.name ? "" : "写一下疫苗名"),
      },
      vaccinePlan: {
        title: "自费 / 替代疫苗计划", kind: "vaccinePlan",
        note: "只记录家长/接种门诊说明，不自动判断覆盖；五联等组合疫苗按门诊给的顺序分针填。",
        fields: [
          { key: "official", label: "官方疫苗（被替代）", type: "text", placeholder: "百白破 / 脊灰灭活" },
          { key: "officialDose", label: "官方第几针", type: "text" },
          { key: "actual", label: "实际疫苗", type: "text", placeholder: "五联 / 13 价肺炎…" },
          { key: "actualDose", label: "实际第几针", type: "text" },
          { key: "months", label: "月龄（可不填）", type: "number" },
          { key: "note", label: "门诊说明（可不填）", type: "text" },
        ],
        build: (v) => ({ official: v.official, officialDose: v.officialDose, actual: v.actual, actualDose: v.actualDose, months: num(v.months), note: v.note, text: v.actual }),
        validate: (v) => (v.official && v.actual ? "" : "官方疫苗和实际疫苗都写一下"),
      },
      milestone: {
        title: "里程碑", kind: "milestone",
        fields: [
          { key: "date", label: "日期", type: "date", default: todayISO() },
          { key: "text", label: "记一句", type: "textarea", placeholder: "第一次…… / 第一次自己……；普通日常请记日常/时间线" },
        ],
        build: (v) => ({ date: v.date, text: v.text }),
        validate: (v) => (v.text ? "" : "写一句就行"),
      },
    };

    function todayISO() {
      const d = new Date();
      const p = (n) => String(n).padStart(2, "0");
      return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
    }
    function sleepMinutes(start, end) {
      const a = String(start || "").match(/^(\d{1,2}):(\d{2})$/);
      const b = String(end || "").match(/^(\d{1,2}):(\d{2})$/);
      if (!a || !b) return 0;
      const mins = (Number(b[1]) * 60 + Number(b[2])) - (Number(a[1]) * 60 + Number(a[2]));
      return mins > 0 ? mins : mins + 24 * 60;
    }
    // 语义色谱：四个基础界面色之外，只给图表/头像用低饱和“纸感”色。
    // 单色红梯度：只用番茄红的透明度层级，不再引入第二色相。
    const CR_PALETTE = {
      terracotta: "#D24B36",
      forest: "rgba(210,75,54,.86)",
      ochre: "rgba(210,75,54,.70)",
      slate: "rgba(210,75,54,.54)",
      plum: "rgba(210,75,54,.38)",
      rose: "rgba(210,75,54,.24)",
    };
    const GRAN_OPTIONS = [["day", "天"], ["week", "周"], ["month", "月"], ["year", "年"]];
    function periodKey(date, gran) {
      const raw = String(date || "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
      if (gran === "year") return raw.slice(0, 4);
      if (gran === "month") return raw.slice(0, 7);
      if (gran === "week") {
        const d = new Date(raw + "T00:00:00Z");
        const day = (d.getUTCDay() + 6) % 7;
        d.setUTCDate(d.getUTCDate() - day);
        return d.toISOString().slice(0, 10);
      }
      return raw;
    }
    function aggregateSeries(rows, dateOf, valueOf, gran) {
      const map = new Map();
      for (const row of rows || []) {
        const key = periodKey(dateOf(row), gran);
        if (!key) continue;
        map.set(key, (map.get(key) || 0) + (Number(valueOf(row)) || 0));
      }
      return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([key, value]) => ({ key, label: key.slice(5), value }));
    }
    function num(v) {
      if (v === undefined || v === null || String(v).trim() === "") return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }

    // ── 主面板 ──
    const foodTypeLabel = (v) => (String(v || '') === "辅食" ? "餐食" : (v || "餐食"));
    function maskName(name, on) {
      const t = String(name == null ? "" : name);
      if (!on) return t;
      return t.length <= 1 ? "＊" : t[0] + "＊";
    }

    const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const mdCell = (v) => String(v == null ? "" : v).replace(/\|/g, "／").replace(/\n/g, " ");

    function downloadFile(name, mime, text) {
      const blob = new Blob([text], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    function exportPrint(title, sections, meta) {
      const stamp = todayISO();
      const body = (sections || []).map((s) => {
        if (!s.rows || !s.rows.length) return "";
        return '<h2>' + esc(s.title) + '</h2><table><thead><tr>' + (s.columns || []).map((c) => '<th>' + esc(c) + '</th>').join("") + '</tr></thead><tbody>' +
          s.rows.map((r) => '<tr>' + (Array.isArray(r) ? r : (s.columns || []).map((c) => r[c])).map((v) => '<td>' + esc(v == null || v === "" ? "—" : v) + '</td>').join("") + '</tr>').join("") +
          '</tbody></table>';
      }).join("");
      const html = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>' +
        '@page{size:A4;margin:15mm}body{font-family:-apple-system,"PingFang SC",sans-serif;color:var(--cr-text,#000000);font-size:11pt;line-height:1.5}h1{font-size:18pt;margin:0 0 4px}h2{font-size:13pt;margin:16px 0 6px;border-bottom:1px solid rgba(0,0,0,.18);padding-bottom:3px}.meta{color:var(--cr-text,#000000);font-size:9pt;margin-bottom:12px}table{width:100%;border-collapse:collapse;margin:4px 0 10px;page-break-inside:auto}tr{page-break-inside:avoid}th,td{border:1px solid #000000;padding:4px 6px;text-align:left;vertical-align:top}th{background:var(--cr-bg,#FAFAFA);font-weight:600}.no-print{margin:10px 0}@media print{.no-print{display:none}}' +
        '</style></head><body><div class="no-print"><button onclick="window.print()">打印 / 另存为 PDF</button></div><h1>' + esc(title) + '</h1><div class="meta">' + esc(meta || "") + ' · ' + stamp + '</div>' + body + '</body></html>';
      downloadFile(title.replace(/[\\/:*?"<>|]/g, "-") + "-" + stamp + ".html", "text/html;charset=utf-8", html);
    }

    function exportMarkdown(title, sections, meta) {
      let md = '# ' + title + '\n\n> ' + (meta || '') + ' · ' + todayISO() + '\n';
      for (const s of sections || []) {
        if (!s.rows || !s.rows.length) continue;
        md += '\n## ' + s.title + '\n\n| ' + (s.columns || []).join(' | ') + ' |\n|' + (s.columns || []).map(() => '---').join('|') + '|\n';
        for (const r of s.rows) md += '| ' + (s.columns || []).map((c) => mdCell(Array.isArray(r) ? r[(s.columns || []).indexOf(c)] : r[c])).join(' | ') + ' |\n';
      }
      downloadFile(title.replace(/[\\/:*?"<>|]/g, "-") + "-" + todayISO() + ".md", "text/markdown;charset=utf-8", md);
    }

    const ROW_LABELS = {
      date: "日期", ageMonths: "月龄", months: "月龄", height: "身高", weight: "体重", head: "头围",
      source: "来源", note: "备注", milk: "奶", poop: "拉", pee: "尿", water: "水", food: "餐食",
      supplement: "补剂", time: "时间", name: "名称", dose: "针次/剂量", reaction: "反应",
      item: "项目", result: "结果", advice: "建议", text: "事件", brand: "品牌", intake: "摄入",
      estimate: "估算", nutrition: "营养", ingredients: "食材", dimension: "维度", context: "场景",
      confidence: "置信度", scale: "量表", next: "下一步", institution: "机构", tool: "评估工具",
      official: "官方疫苗", officialDose: "官方针次", actual: "实际疫苗", actualDose: "实际针次",
      week: "孕周", preWeight: "孕前体重", meal: "餐次", report: "报告", findings: "结论",
    };

    function recordWeekKey(date) {
      const d = new Date(date + "T00:00:00Z");
      if (Number.isNaN(d.getTime())) return String(date || "");
      const day = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - day);
      const year = d.getUTCFullYear();
      const start = new Date(Date.UTC(year, 0, 1));
      const week = Math.ceil((((d - start) / 86400000) + 1) / 7);
      return year + "-W" + String(week).padStart(2, "0");
    }

    function groupKey(date, gran) {
      const d = String(date || "");
      if (gran === "day") return d;
      if (gran === "week") return recordWeekKey(d);
      if (gran === "month") return d.slice(0, 7);
      if (gran === "year") return d.slice(0, 4);
      return d;
    }

    function aggregateRows(section, gran) {
      if (!section || gran === "day" || !section.granularity || !section.granularity.includes(gran)) return section.rows || [];
      const groups = new Map();
      for (const r of section.rows || []) {
        const k = groupKey(r.date, gran);
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(r);
      }
      return [...groups.entries()].map(([key, rows]) => {
        if (section.key === "daily") {
          const sum = (f) => rows.reduce((a, r) => a + (Number(r[f]) || 0), 0);
          return { date: key, months: "记录 " + rows.length + " 天", milk: (sum("milkMl") ? sum("milkMl") + "ml" : "—") + (sum("milkCount") ? " / " + sum("milkCount") + " 次" : ""), poop: sum("poopCount") + " 次", pee: sum("peeCount") + " 次", water: sum("waterMl") + "ml", supplement: rows.filter((r) => r.supplement).length + " 天" };
        }
        if (section.key === "growth") {
          const latest = rows.slice().sort((a, b) => (a.date < b.date ? 1 : -1))[0] || {};
          return { date: key, ageMonths: latest.ageMonths, height: latest.height, weight: latest.weight, head: latest.head, source: "最新一条" };
        }
        return { date: key, text: "记录 " + rows.length + " 条" };
      }).sort((a, b) => (a.date < b.date ? 1 : -1));
    }

    function AllRecordsModal({ kind, childId, onClose, load }) {
      const [data, setData] = useState(null);
      const [err, setErr] = useState("");
      const [section, setSection] = useState(0);
      const [gran, setGran] = useState("");
      useEffect(() => {
        load(kind).then((r) => {
          if (!r || !r.ok) { setErr((r && r.error) || "读取失败"); return; }
          setData(r);
          const first = (r.sections || [])[0];
          setSection(0);
          setGran(first && first.granularity && first.granularity[0] || "all");
        }).catch((e) => setErr(String(e && e.message ? e.message : e)));
      }, [kind]);
      const sections = (data && data.sections) || [];
      const cur = sections[section];
      useEffect(() => {
        if (cur && cur.granularity && cur.granularity.length && !cur.granularity.includes(gran)) setGran(cur.granularity[0]);
      }, [section]);
      const rows = cur ? aggregateRows(cur, gran) : [];
      const keys = cur ? [...new Set((cur.rows || []).flatMap((r) => Object.keys(r)).filter((k) => !k.endsWith("Ml") && !k.endsWith("Count") && !k.endsWith("Days") && !["originalDimensions"].includes(k)))] : [];
      return h("div", { className: "cr-overlay", onClick: onClose },
        h("div", { className: "cr-sheet", style: { width: "min(760px,100%)" }, onClick: (e) => e.stopPropagation() },
          h("h3", null, "全部记录", cur ? " · " + cur.title : ""),
          sections.length > 1 ? h("div", { className: "cr-mode", style: { flexWrap: "wrap" } }, sections.map((s, i) => h("button", { key: s.key, className: "cr-pill " + (i === section ? "on" : ""), onClick: () => setSection(i) }, s.title))) : null,
          h("div", { className: "cr-metrics", style: { marginBottom: "6px" } },
            h("button", { className: "cr-btn ghost", onClick: () => exportPrint("全部记录 · " + (cur ? cur.title : ""), [{
              title: cur ? cur.title : "记录", columns: keys.map((k) => ROW_LABELS[k] || k), rows: rows.map((r) => keys.map((k) => r[k])),
            }], "问问 · 全部记录") }, "导出打印版"),
            h("button", { className: "cr-btn ghost", onClick: () => exportMarkdown("全部记录 · " + (cur ? cur.title : ""), [{
              title: cur ? cur.title : "记录", columns: keys.map((k) => ROW_LABELS[k] || k), rows: rows.map((r) => keys.map((k) => r[k])),
            }], "问问 · 全部记录") }, "导出 Markdown")
          ),
          cur && cur.granularity && cur.granularity.length ? h("div", { className: "cr-mode", style: { flexWrap: "wrap" } },
            [["day", "按天"], ["week", "按周"], ["month", "按月"], ["year", "按年"]].filter(([k]) => cur.granularity.includes(k)).map(([k, label]) => h("button", { key: k, className: "cr-pill " + (gran === k ? "on" : ""), onClick: () => setGran(k) }, label))
          ) : null,
          err ? h("div", { className: "cr-mut", style: { color: "#D24B36" } }, err) : null,
          rows.length ? h("div", { className: "cr-table-wrap" },
            h("table", { className: "cr-table" },
              h("thead", null, h("tr", null, keys.map((k) => h("th", { key: k }, ROW_LABELS[k] || k)))),
              h("tbody", null, rows.slice().reverse().map((r, i) => h("tr", { key: i }, keys.map((k) => h("td", { key: k }, r[k] == null || r[k] === "" ? "—" : String(r[k]))))))
            )
          ) : h("div", { className: "cr-empty" }, "没有记录。"),
          h("button", { className: "cr-btn", style: { marginTop: "10px" }, onClick: onClose }, "关闭")
        )
      );
    }

    function CustomSummaryPanel({ forms }) {
      if (!forms || !forms.length) return null;
      return h("div", { className: "cr-card" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "自定义汇总", h("span", { className: "cr-mut" }, "用户创建 · 按表单")),
        h("div", { className: "cr-free-grid" }, forms.map((f) => h("div", { className: "cr-free-card", key: f.id },
          h("b", null, f.name),
          h("div", { className: "cr-mut" }, f.fields.length + " 个字段 · " + f.fields.map((x) => x.label).slice(0, 3).join(" / ")),
          h("div", { className: "cr-mut", style: { marginTop: "4px" } }, "记录在 自定义/记录/" + f.id + ".md")
        )))
      );
    }

    function SummaryDashboard({ overview, isFree, onAll, privacyMode }) {
      const child = (overview && overview.child) || {};
      const stageKey = (child.stage && child.stage.key) || "toddler";
      const isPregnancy = stageKey === "pregnancy";
      const isPreconception = stageKey === "preconception";
      const showChild = !isPregnancy && !isPreconception && !isFree;
      const agg = (overview && overview.dailyAggregates) || null;
      const growth = (overview && overview.growth) || null;
      const nutrition = (overview && overview.nutritionCompare && overview.nutritionCompare.ok) ? overview.nutritionCompare : null;
      const vax = (overview && overview.vaccineCompare && overview.vaccineCompare.summary) || null;
      const exp = (overview && overview.expenseSummary) || null;
      const expEst = (overview && overview.expenseEstimate) || null;
      const milk = (overview && overview.milkSummary) || null;
      const supp = (overview && overview.supplementSummary) || null;
      const foodRows = (overview && overview.foodRows) || [];
      const assess = (overview && overview.assess) || null;
      const forms = (overview && overview.customForms) || [];
      const p = (overview && overview.pregnancy) || null;
      const tile = (title, value, note, extra) => h("div", { className: "cr-sum-tile", key: title },
        h("div", { className: "cr-sum-title" }, title),
        h("div", { className: "cr-sum-value" }, value),
        h("div", { className: "cr-sum-note" }, note),
        extra || null
      );
      return h("div", { className: "cr-card cr-summary", id: "cr-summary" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "全部数据汇总 · " + (child.stage ? child.stage.label : "当前档案"), h("div", { className: "cr-metrics" },
          h("span", { className: "cr-mut" }, "全部记录 · 图表只读 Markdown"),
          h("button", { className: "cr-btn ghost", onClick: () => {
            const sections = [];
            sections.push({ title: "基本信息", columns: ["项目", "内容"], rows: [["孩子", maskName(child.name, privacyMode) || ""], ["月龄", child.ageText || ""], ["阶段", child.stage ? child.stage.label : ""]] });
            if (showChild && agg && agg.total) sections.push({ title: "日常 · 按天汇总", columns: ["项目", "数值"], rows: [["有记录天数", agg.total.days], ["拉", agg.total.poopCount + " 次"], ["尿", agg.total.peeCount + " 次"], ["水", agg.total.waterMl + " ml"]] });
            if (showChild && milk && milk.total) sections.push({ title: "奶记录 · 按品种", columns: ["品种", "总量(ml)", "次数"], rows: milk.byType.map((x) => [x.type, Math.round(x.amount), x.count]) });
            if (showChild && supp && supp.byNutrient.length) sections.push({ title: "补剂 · 按成分", columns: ["成分", "总量", "次数"], rows: supp.byNutrient.map((x) => [x.name, Math.round(x.amount * 100) / 100 + (x.unit || ""), x.count]) });
            if (showChild && growth) sections.push({ title: "生长 · 最新", columns: ["日期", "身高", "体重", "头围", "BMI"], rows: [[growth.date, growth.height, growth.weight, growth.head || "—", (Number(growth.height) > 0 && Number(growth.weight) > 0 ? (Number(growth.weight) / Math.pow(Number(growth.height) / 100, 2)).toFixed(1) : "—")]] });
            if (showChild && nutrition) sections.push({ title: "营养 · 近7天按天平均", columns: ["指标", "参考/天", "已记录平均"], rows: [["能量", nutrition.ref.kcal, Math.round(nutrition.avg.kcal)], ["蛋白质", nutrition.ref.protein, Math.round(nutrition.avg.protein)], ["铁", nutrition.ref.iron, nutrition.avg.iron.toFixed(1)], ["钙", nutrition.ref.calcium, Math.round(nutrition.avg.calcium)]] });
            if (showChild && vax) sections.push({ title: "疫苗 · 按针次", columns: ["项目", "数值"], rows: [["已记录", vax.done], ["未记录", vax.due], ["替代", vax.alt], ["总针数", vax.total]] });
            if (showChild && overview && overview.checkupRows) sections.push({ title: "体检", columns: ["日期", "项目", "结果"], rows: overview.checkupRows.slice(0, 8).map((r) => [r.date, r.item, r.result]) });
            if (showChild && foodRows.length) sections.push({ title: "餐食 · 按记录", columns: ["日期", "类型", "食物", "份量", "营养"], rows: foodRows.slice(0, 12).map((r) => [r.date, foodTypeLabel(r.foodType), r.food, r.quantity || r.ingredients || "", r.nutrition || ""]) });
            if (exp && exp.count) sections.push({ title: "花费 · 已记", columns: ["日期", "类别", "项目", "金额"], rows: (overview.expenseRows || []).slice(0, 12).map((r) => [r.date, r.category, r.item, r.amount]) });
            if (isFree && forms.length) sections.push({ title: "自定义表单", columns: ["表单", "字段"], rows: forms.map((f) => [f.name, f.fields.map((x) => x.label).join(" / ")]) });
            exportPrint("问问 · 总汇总", sections, child.name ? maskName(child.name, privacyMode) + " · " + (child.stage ? child.stage.label : "") : "");
          } }, "导出总汇总")
        )),
        isFree ? h("div", { className: "cr-mut", style: { lineHeight: 1.6 } }, "自由模式不使用 0–3 岁固定模板；下列为已创建的自定义表单。") : null,
        h("div", { className: "cr-sum-grid" },
          (showChild && agg && agg.total && agg.total.days) ? tile("日常", agg.total.days + " 天", "全部记录 · 水 " + agg.total.waterMl + "ml · 拉 " + agg.total.poopCount + " 次 · 尿 " + agg.total.peeCount + " 次", h(BarChart, { items: agg.months.slice(0, 6).slice().reverse().map((x) => ({ label: x.key.slice(5), value: x.milkMl })), unit: "ml", color: "#D24B36" })) : null,
          (showChild && milk && milk.total) ? tile("奶量", Math.round(milk.total) + " ml", "全部记录 · " + milk.byType.map((x) => x.type + " " + Math.round(x.amount)).join(" · "), null) : null,
          (showChild && overview && overview.sleepSummary && overview.sleepSummary.count) ? tile("睡眠", Math.round(overview.sleepSummary.totalMinutes / 60 * 10) / 10 + " 小时", "全部记录 · " + overview.sleepSummary.count + " 条 · 平均 " + Math.round(overview.sleepSummary.avgMinutes) + " 分钟", null) : null,
          (showChild && supp && supp.byNutrient.length) ? tile("补剂", supp.byNutrient.length + " 种成分", supp.byNutrient.slice(0, 3).map((x) => x.name + " " + Math.round(x.amount * 100) / 100 + (x.unit || "")).join(" · "), null) : null,
          (showChild && growth) ? tile("生长", growth.height + " cm", "最新 · " + growth.date + " · 按月龄" + (Number(growth.height) > 0 && Number(growth.weight) > 0 ? " · BMI " + (Number(growth.weight) / Math.pow(Number(growth.height) / 100, 2)).toFixed(1) : ""), null) : null,
          (showChild && nutrition) ? tile("营养", Math.round(nutrition.avg.kcal || 0) + " kcal", "近 7 天按有记录天平均 · 按天", null) : null,
          ((exp && (exp.actualCount || exp.estimatedTotal)) || (expEst && expEst.ok)) ? (() => {
            const actual = Number(exp && exp.actualTotal) || 0;
            const saved = Number(exp && exp.estimatedTotal) || 0;
            const auto = Number(expEst && expEst.ok && expEst.monthly) || 0;
            const value = actual || saved || auto;
            const note = actual
              ? "已记实际 · 本月实际 ¥" + Math.round(exp.monthTotal).toLocaleString("zh-CN")
              : saved ? "已保存预估 · 不计入实际" : "未记账 · 按记录示例均价估算";
            return tile("花费", (actual || saved ? "¥" : "约 ¥") + Math.round(value).toLocaleString("zh-CN"), note, null);
          })() : null,
          (showChild && vax) ? tile("疫苗", vax.done + "/" + vax.total, "按针次对照 · 未记录 " + vax.due, h(DonutChart, { segments: [{ value: vax.done, color: "#D24B36" }, { value: vax.alt, color: "rgba(210,75,54,.55)" }, { value: vax.due, color: "rgba(210,75,54,.30)" }], center: vax.done + "/" + vax.total, size: 46 })) : null,
          (showChild && overview && overview.checkupRows && overview.checkupRows.length) ? tile("体检", overview.checkupRows.length + " 次", "按次记录 · 最近 " + overview.checkupRows[0].date, null) : null,
          (showChild && overview && overview.milestoneRows && overview.milestoneRows.length) ? tile("里程碑", overview.milestoneRows.length + " 条", "按时间 · 最近 " + overview.milestoneRows[0].date, null) : null,
          (showChild && assess) ? tile("发育评估", assess.checkpoint + " 月龄", "按月龄 · 前/当前/后三个检查点", null) : null,
          (showChild && overview && overview.personality && overview.personality.length) ? tile("人格/偏好", overview.personality.length + " 条", "按观察 · 最近 " + (overview.personality[overview.personality.length - 1].date || ""), null) : null,
          (isPreconception && overview && overview.prep) ? tile("备孕", (overview.prep.cycles || []).length + " 个周期", "按周期 · " + ((overview.prep.checkups || []).length) + " 次孕前检查", null) : null,
          (isPregnancy && p && p.week !== undefined) ? (() => {
            const basic = p.basic || {};
            const latestV = (p.vitals || [])[(p.vitals || []).length - 1] || {};
            const preW = Number(basic.preWeight), hW = Number(basic.height);
            const bmi = preW > 0 && hW > 0 ? (preW / Math.pow(hW / 100, 2)).toFixed(1) : "—";
            const gain = latestV.weight && preW > 0 ? (Number(latestV.weight) - preW) : undefined;
            return tile("孕期", p.week + " 周", "按孕周" + (p.dueDate ? " · 预产期 " + p.dueDate : "") + " · 孕前 BMI " + bmi + (gain !== undefined ? " · 增重 " + (gain >= 0 ? "+" : "") + gain.toFixed(1) + "kg" : ""), null);
          })() : null,
          (isFree && forms.length) ? tile("自定义", forms.length + " 个表单", "用户创建 · 放最后", null) : null
        ),
        (!showChild && !isPregnancy && !isPreconception && !(exp && exp.count) && !(expEst && expEst.ok)) ? h("div", { className: "cr-empty" }, "还没有可汇总的数据。") : null,
        h("div", { className: "cr-mut", style: { marginTop: "8px", lineHeight: 1.6 } }, "汇总口径：日常/奶/睡眠/生长/疫苗为当前档案的全部记录；营养为近 7 天有记录天平均。数据只读自 Markdown，不额外生成事实。")
      );
    }

    function FreePanel({ overview, onNew, onRecord, onView }) {
      const forms = (overview && overview.customForms) || [];
      return h("div", { className: "cr-card", id: "cr-free" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "我的表单",
          h("button", { className: "cr-btn primary", onClick: onNew }, "新建表单")),
        h("div", { className: "cr-mut", style: { lineHeight: 1.6 } }, "3 岁后由家长定义记录内容；自定义表单独立保存，内置模板不会覆盖。"),
        forms.length ? h("div", { className: "cr-free-grid" }, forms.map((f) => h("div", { className: "cr-free-card", key: f.id },
          h("b", null, f.name),
          h("div", { className: "cr-mut" }, f.fields.map((x) => x.label).join(" · ")),
          h("div", { className: "cr-metrics", style: { marginTop: "8px" } },
            h("button", { className: "cr-btn", onClick: () => onRecord(f) }, "记一条"),
            h("button", { className: "cr-btn ghost", onClick: () => onView(f) }, "看记录")
          )
        ))) : h("div", { className: "cr-empty" }, "暂无自定义表单。可点击「新建表单」创建。")
      );
    }

    function NewFormModal({ onClose, onCreate }) {
      const [name, setName] = useState("");
      const [fields, setFields] = useState([{ label: "内容", type: "text", options: "" }]);
      const [busy, setBusy] = useState(false);
      const [err, setErr] = useState("");
      const typeOpts = [["text", "文字"], ["textarea", "长文字"], ["number", "数字"], ["date", "日期"], ["select", "选项"]];
      const setF = (i, patch) => setFields(fields.map((f, j) => j === i ? { ...f, ...patch } : f));
      async function save() {
        if (!name.trim() || !fields.every((f) => f.label.trim())) { setErr("表单名和字段名都要填"); return; }
        setBusy(true);
        const r = await onCreate({ name: name.trim(), fields: fields.map((f, i) => ({ key: "f" + i, label: f.label.trim(), type: f.type, options: f.type === "select" ? String(f.options || "").split(/[，,]/).map((x) => x.trim()).filter(Boolean) : undefined })) }).catch(() => null);
        setBusy(false);
        if (r && r.ok) onClose();
        else setErr((r && r.error) || "创建失败");
      }
      return h("div", { className: "cr-overlay", onClick: onClose },
        h("div", { className: "cr-sheet", onClick: (e) => e.stopPropagation() },
          h("h3", null, "新建自定义表单"),
          h("div", { className: "cr-field" }, h("label", null, "表单名"), h("input", { value: name, placeholder: "比如：今天的大事 / 每周身高", onChange: (e) => setName(e.target.value) })),
          h("div", { className: "cr-sec" }, "字段（日期会自动加在最前面）"),
          fields.map((f, i) => h("div", { className: "cr-free-field", key: i },
            h("input", { value: f.label, placeholder: "字段名", onChange: (e) => setF(i, { label: e.target.value }) }),
            h("select", { value: f.type, onChange: (e) => setF(i, { type: e.target.value }) }, typeOpts.map(([k, v]) => h("option", { key: k, value: k }, v))),
            h("button", { className: "cr-btn ghost", onClick: () => setFields(fields.filter((_, j) => j !== i)) }, "删"),
            f.type === "select" ? h("input", { value: f.options || "", placeholder: "选项，用逗号分隔", onChange: (e) => setF(i, { options: e.target.value }), style: { width: "100%", marginTop: "4px" } }) : null
          )),
          h("button", { className: "cr-btn", onClick: () => setFields([...fields, { label: "", type: "text", options: "" }]) }, "+ 加字段"),
          err ? h("div", { className: "cr-mut", style: { color: "#D24B36", marginTop: "6px" } }, err) : null,
          h("button", { className: "cr-btn primary", style: { marginTop: "10px", width: "100%" }, disabled: busy, onClick: save }, busy ? "保存中…" : "创建表单")
        )
      );
    }

    function CustomFormModal({ form, onClose, onSave }) {
      const [values, setValues] = useState({ date: todayISO() });
      const [busy, setBusy] = useState(false);
      const [err, setErr] = useState("");
      async function save() {
        setBusy(true);
        const r = await onSave(form, values).catch(() => null);
        setBusy(false);
        if (r && r.ok) onClose();
        else setErr((r && r.error) || "保存失败");
      }
      return h("div", { className: "cr-overlay", onClick: onClose },
        h("div", { className: "cr-sheet", onClick: (e) => e.stopPropagation() },
          h("h3", null, form.name),
          h("div", { className: "cr-field" }, h("label", null, "日期"), h("input", { type: "date", value: values.date, onChange: (e) => setValues({ ...values, date: e.target.value }) })),
          form.fields.map((f) => h("div", { className: "cr-field", key: f.key },
            h("label", null, f.label),
            f.type === "select"
              ? h("select", { value: values[f.key] || "", onChange: (e) => setValues({ ...values, [f.key]: e.target.value }) },
                h("option", { value: "" }, "请选择"), (f.options || []).map((o) => h("option", { key: o, value: o }, o)))
              : f.type === "textarea"
                ? h("textarea", { value: values[f.key] || "", onChange: (e) => setValues({ ...values, [f.key]: e.target.value }) })
                : h("input", { type: f.type === "number" ? "number" : f.type === "date" ? "date" : "text", value: values[f.key] || "", onChange: (e) => setValues({ ...values, [f.key]: e.target.value }) })
          )),
          err ? h("div", { className: "cr-mut", style: { color: "#D24B36", marginTop: "6px" } }, err) : null,
          h("button", { className: "cr-btn primary", style: { marginTop: "10px", width: "100%" }, disabled: busy, onClick: save }, busy ? "保存中…" : "保存")
        )
      );
    }

    function CustomRecordsModal({ form, onClose, load }) {
      const [rows, setRows] = useState([]);
      const [err, setErr] = useState("");
      useEffect(() => { load(form.id).then((r) => { if (r && r.ok) setRows(r.rows || []); else setErr((r && r.error) || "读取失败"); }).catch((e) => setErr(String(e && e.message ? e.message : e))); }, [form.id]);
      return h("div", { className: "cr-overlay", onClick: onClose },
        h("div", { className: "cr-sheet", onClick: (e) => e.stopPropagation() },
          h("h3", null, form.name + " · 记录"),
          h("div", { className: "cr-metrics", style: { marginBottom: "6px" } },
            h("button", { className: "cr-btn ghost", onClick: () => exportPrint("自定义记录 · " + form.name, [{
              title: form.name, columns: ["日期", ...form.fields.map((f) => f.label)],
              rows: rows.slice().reverse().map((r) => ["日期", ...form.fields.map((f) => f.label)].map((h2) => r[h2])),
            }], "问问 · 自定义记录") }, "导出打印版"),
            h("button", { className: "cr-btn ghost", onClick: () => exportMarkdown("自定义记录 · " + form.name, [{
              title: form.name, columns: ["日期", ...form.fields.map((f) => f.label)],
              rows: rows.slice().reverse().map((r) => ["日期", ...form.fields.map((f) => f.label)].map((h2) => r[h2])),
            }], "问问 · 自定义记录") }, "导出 Markdown")
          ),
          err ? h("div", { className: "cr-mut", style: { color: "#D24B36" } }, err) : null,
          rows.length ? h("div", { className: "cr-table-wrap" },
            h("table", { className: "cr-table" },
              h("thead", null, h("tr", null, ["日期", ...form.fields.map((f) => f.label)].map((h2) => h("th", { key: h2 }, h2)))),
              h("tbody", null, rows.slice().reverse().map((r, i) => h("tr", { key: i }, ["日期", ...form.fields.map((f) => f.label)].map((h2) => h("td", { key: h2 }, r[h2] || "—")))))
            )
          ) : h("div", { className: "cr-empty" }, "还没有记录。"),
          h("button", { className: "cr-btn", style: { marginTop: "10px" }, onClick: onClose }, "关闭")
        )
      );
    }

    function PendingPanel({ items, onConfirm, onCancel }) {
      if (!items || !items.length) return null;
      return h("div", { className: "cr-card cr-pending", id: "cr-pending" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "待确认", h("span", { className: "cr-mut" }, "模型拿不准 / 敏感内容")),
        items.map((x) => h("div", { className: "cr-pending-row", key: x.id },
          h("div", { style: { minWidth: 0, flex: 1 } },
            h("div", { className: "cr-pending-text" }, x.summary),
            h("div", { className: "cr-recent-date" }, (x.kind || "记录") + " · " + (x.createdAt || ""))
          ),
          h("div", { className: "cr-metrics" },
            h("button", { className: "cr-btn primary", onClick: () => onConfirm(x.id) }, "确认写入"),
            h("button", { className: "cr-btn ghost", onClick: () => onCancel(x.id) }, "不记")
          )
        ))
      );
    }

    function StageGuideCard({ guide, onAll }) {
      if (!guide || !guide.items || !guide.items.length) return null;
      return h("div", { className: "cr-card", id: "cr-stage-guide" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "本阶段常见 · " + guide.label, h("button", { className: "cr-btn ghost", onClick: onAll }, "全部")),
        guide.items.slice(0, 2).map((x, i) => h("div", { className: "cr-guide-row", key: x.title },
          h("span", { className: "cr-guide-index" }, i + 1),
          h("div", null,
            h("b", null, x.title),
            h("div", { className: "cr-mut", style: { marginTop: "2px", lineHeight: 1.5 } }, x.body))
        )),
        h("div", { className: "cr-mut", style: { marginTop: "6px" } }, guide.disclaimer || "")
      );
    }

    function StageGuideModal({ guide, onClose }) {
      return h("div", { className: "cr-overlay", onClick: onClose },
        h("div", { className: "cr-sheet", onClick: (e) => e.stopPropagation() },
          h("h3", null, "本阶段常见 · " + guide.label),
          guide.items.map((x) => h("div", { className: "cr-guide-row", key: x.title },
            h("b", null, x.title),
            h("div", { className: "cr-mut", style: { marginTop: "2px", lineHeight: 1.55 } }, x.body)
          )),
          h("div", { className: "cr-mut", style: { marginTop: "8px" } }, guide.disclaimer || ""),
          h("button", { className: "cr-btn", style: { marginTop: "10px" }, onClick: onClose }, "关闭")
        )
      );
    }

    function AgeReminderCard({ overview, onForm, onScroll }) {
      const items = [];
      const child = (overview && overview.child) || {};
      const months = Number(child.months);
      const today = todayISO();
      const long = (d) => Math.round((new Date(today + "T00:00:00Z") - new Date(String(d) + "T00:00:00Z")) / 86400000);
      const growth = overview && overview.growth;
      if (Number.isFinite(months) && months >= 0) {
        const interval = months < 12 ? 30 : months < 36 ? 90 : months < 72 ? 180 : 365;
        if (growth && growth.date && growth.date <= today) {
          const days = long(growth.date);
          if (days >= interval) items.push({ key: "growth", title: "该量身高体重了", body: "距上次 " + days + " 天；上次 " + growth.date + "。只是记录提醒，不是体检结论。", action: "去记生长", onClick: () => onForm("growth") });
        } else if (!growth) {
          items.push({ key: "growth", title: "还没有生长数据", body: "可以量一次身高体重，头围随体检一起。", action: "去记生长", onClick: () => onForm("growth") });
        }
      }
      const sg = overview && overview.stageGuide;
      if (sg && sg.items && sg.items.length) items.push({ key: "stage", title: "本阶段：" + sg.label, body: sg.items[0].title + "；看参照卡", action: "看参照", onClick: () => onScroll("cr-stage-guide") });
      const vc = overview && overview.vaccineCompare;
      if (vc && vc.summary && vc.summary.due > 0) {
        items.push({ key: "vaccine", title: "疫苗对照：" + vc.summary.due + " 针档案未记录", body: "这是官方程序对照，不代表漏打；具体以接种门诊为准。", action: "看对照", onClick: () => onScroll("cr-vaccine") });
      }
      const assess = overview && overview.assess;
      if (assess && Number.isFinite(months)) {
        const hist = (overview.assessHistory || []).map((x) => String(x.scale || ""));
        const marked = (m) => hist.some((s) => s.includes(m + " 月龄"));
        if (assess.next && months >= assess.next && !marked(assess.next)) {
          items.push({ key: "assess", title: assess.next + " 月龄自评可以做了", body: "逐项点是/有时/否，不是考试，也不打分。", action: "去评估", onClick: () => onScroll("cr-assessment") });
        } else if (assess.checkpoint && months >= assess.checkpoint && !marked(assess.checkpoint)) {
          items.push({ key: "assess", title: assess.checkpoint + " 月龄自评还没记录", body: "筛查不是诊断；有不确定项问儿保。", action: "去评估", onClick: () => onScroll("cr-assessment") });
        }
      }
      const p = overview && overview.pregnancy;
      if (p && Number.isFinite(Number(p.week))) {
        const week = Number(p.week);
        const current = PREGNANCY_MILESTONES.find((m) => week >= m.start && week <= m.end);
        const next = PREGNANCY_MILESTONES.find((m) => week < m.start);
        if (current) items.push({ key: "preg", title: "孕 " + week + " 周：" + current.title, body: current.note + "；按医生安排，不是自动医嘱。", action: "看孕期", onClick: () => onScroll("cr-pregnancy") });
        else if (next) items.push({ key: "preg", title: "下一个孕期节点：" + next.title, body: next.note + "；可设提醒。", action: "看孕期", onClick: () => onScroll("cr-pregnancy") });
      }
      if (!items.length) return h("div", { className: "cr-reminder-empty-line" }, "提醒 · 暂无到点；到点后会出现在这里。");
      return h("div", { className: "cr-card cr-reminder", id: "cr-reminders" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "提醒", h("span", { className: "cr-mut" }, "到点才出现")),
        items.length ? items.map((x) => h("div", { key: x.key, className: "cr-reminder-row" },
          h("div", { className: "cr-reminder-dot" }),
          h("div", { style: { minWidth: 0, flex: 1 } },
            h("div", { className: "cr-reminder-title" }, x.title),
            h("div", { className: "cr-mut", style: { marginTop: "2px" } }, x.body)
          ),
          h("button", { className: "cr-btn ghost", onClick: x.onClick }, x.action)
        )) : h("div", { className: "cr-mut" }, "暂时没有到点的提醒。")
      );
    }

    const KEY_METRICS = {
      milk: { label: "奶量", unit: "ml", color: "#D24B36" },
      sleep: { label: "睡眠", unit: "小时", color: CR_PALETTE.plum },
      diaper: { label: "尿布", unit: "次", color: CR_PALETTE.rose },
      food: { label: "餐食", unit: "次", color: CR_PALETTE.forest },
      expense: { label: "花费", unit: "元", color: CR_PALETTE.rose },
      weight: { label: "体重", unit: "kg", color: CR_PALETTE.slate },
      growth: { label: "身高", unit: "cm", color: CR_PALETTE.forest },
    };
    function defaultKeyMetrics(stageKey) {
      if (stageKey === "pregnancy") return ["weight", "sleep", "expense"];
      if (stageKey === "preconception") return ["sleep", "expense", "weight"];
      if (stageKey === "preschool" || stageKey === "school") return ["sleep", "food", "expense"];
      return ["milk", "sleep", "diaper"];
    }
    function keyMetricSeries(id, overview) {
      const o = overview || {};
      const rows = (o.recordRows || []).filter((r) => !r.inferred);
      const days = rows.slice(0, 7).slice().reverse();
      if (id === "milk") {
        const by = new Map();
        for (const r of (o.milkRows || [])) {
          if (!r.date) continue;
          by.set(r.date, (by.get(r.date) || 0) + (Number(r.amount) || 0));
        }
        if (by.size) return [...by.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-7).map(([date, value]) => ({ label: date.slice(5), value }));
        return days.map((r) => ({ label: r.date.slice(5), value: Number(r.milkMl) || 0 }));
      }
      if (id === "diaper") return days.map((r) => ({ label: r.date.slice(5), value: (Number(r.poopCount) || 0) + (Number(r.peeCount) || 0) }));
      if (id === "sleep") return ((o.sleepSummary && o.sleepSummary.byDay) || []).slice(0, 7).slice().reverse().map((r) => ({ label: r.date.slice(5), value: Math.round((Number(r.minutes) || 0) / 60 * 10) / 10 }));
      if (id === "food") {
        const by = new Map();
        for (const f of (o.foodRows || [])) by.set(f.date, (by.get(f.date) || 0) + 1);
        return [...by.entries()].slice(0, 7).reverse().map(([date, value]) => ({ label: date.slice(5), value }));
      }
      if (id === "expense") {
        const by = new Map();
        for (const e of (o.expenseRows || [])) by.set(e.date, (by.get(e.date) || 0) + (Number(e.amount) || 0));
        return [...by.entries()].slice(0, 7).reverse().map(([date, value]) => ({ label: date.slice(5), value }));
      }
      if (id === "weight") {
        const isPregnancy = o.child && o.child.stage && o.child.stage.key === "pregnancy";
        if (isPregnancy) {
          const vit = ((o.pregnancy && o.pregnancy.vitals) || []).slice(-7);
          return vit.map((r) => ({ label: (r.date || "").slice(5), value: Number(r.weight) || 0 }));
        }
        return ((o.growthRows || []).slice(-7)).map((r) => ({ label: (r.date || "").slice(5), value: Number(r.weight) || 0 }));
      }
      if (id === "growth") {
        return ((o.growthRows || []).slice(-7)).map((r) => ({ label: (r.date || "").slice(5), value: Number(r.height) || 0 }));
      }
      return [];
    }
    function MiniBars({ points, color }) {
      const max = Math.max(...(points || []).map((p) => p.value), 1);
      return h("div", { className: "cr-key-bars" }, (points || []).map((p, i) => h("i", { key: i, title: p.label + " " + p.value, style: { height: Math.max(2, Math.round(p.value / max * 44)) + "px", background: color } })));
    }
    function KeyMetricsCard({ overview, child, onSaved }) {
      const stageKey = child && child.stage && child.stage.key;
      const initial = (child && child.keyMetrics && child.keyMetrics.length) ? child.keyMetrics : defaultKeyMetrics(stageKey);
      const [metrics, setMetrics] = useState(initial);
      const [editing, setEditing] = useState(false);
      const [msg, setMsg] = useState("");
      useEffect(() => { setMetrics((child && child.keyMetrics && child.keyMetrics.length) ? child.keyMetrics : defaultKeyMetrics(stageKey)); }, [child && child.id, JSON.stringify(child && child.keyMetrics)]);
      if (!overview) return null;
      const save = async () => {
        if (!metrics.length) { setMsg("至少选一个"); return; }
        const r = await api("/key-metrics", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId: child.id, metrics }) }).catch(() => null);
        if (r && r.ok) { setEditing(false); setMsg("已保存"); if (onSaved) onSaved(); } else setMsg((r && r.error) || "保存失败");
      };
      return h("div", { className: "cr-card", id: "cr-key-metrics" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "关键指标", h("div", { className: "cr-metrics" },
          h("span", { className: "cr-mut" }, "按阶段默认 · 可改"),
          h("button", { className: "cr-btn ghost", onClick: () => setEditing(!editing) }, editing ? "收起" : "改指标")
        )),
        editing ? h("div", null,
          h("div", { className: "cr-key-edit" }, Object.entries(KEY_METRICS).map(([id, m]) => h("button", {
            key: id, className: "cr-pill " + (metrics.includes(id) ? "on" : ""), onClick: () => {
              setMetrics(metrics.includes(id) ? metrics.filter((x) => x !== id) : metrics.length >= 3 ? metrics : [...metrics, id]);
            }
          }, m.label))),
          h("div", { className: "cr-metrics" }, h("button", { className: "cr-btn primary", onClick: save }, "保存"), msg ? h("span", { className: "cr-mut" }, msg) : null)
        ) : null,
        h("div", { className: "cr-key-grid" }, (metrics.length ? metrics : initial).slice(0, 3).map((id) => {
          const def = KEY_METRICS[id] || { label: id, unit: "", color: "#D24B36" };
          const points = keyMetricSeries(id, overview);
          const total = points.reduce((a, p) => a + p.value, 0);
          return h("div", { key: id, className: "cr-key-card" },
            h("div", { className: "cr-key-title" }, def.label),
            h("div", { className: "cr-key-value" }, Math.round(total * 10) / 10, h("span", null, " " + def.unit)),
            h(MiniBars, { points, color: def.color }),
            h("div", { className: "cr-key-note" }, "近 7 天")
          );
        }))
      );
    }

    function TimeNotesCard({ overview, onCarryOver }) {
      const [now, setNow] = useState(new Date());
      useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);
      const today = todayISO();
      const hhmm = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const parse = (t) => { const m = String(t || "").match(/^(\d{1,2}):(\d{2})$/); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
      const entries = [];
      for (const it of ((overview && overview.todos && overview.todos.items) || [])) {
        if (it.date === today && parse(it.time) !== null) entries.push({ time: it.time, min: parse(it.time), label: "待办 · " + it.text, kind: "todo" });
      }
      for (const r of ((overview && overview.specialSupplementRows) || [])) {
        if (parse(r.time) !== null) entries.push({ time: r.time, min: parse(r.time), label: "补剂 · " + [r.name, r.dose].filter(Boolean).join(" "), kind: "supp" });
      }
      for (const r of ((overview && overview.medicationRows) || [])) {
        if (parse(r.time) !== null) entries.push({ time: r.time, min: parse(r.time), label: "用药 · " + [r.name, r.dose].filter(Boolean).join(" "), kind: "med" });
      }
      entries.sort((a, b) => a.min - b.min);
      const upcoming = entries.filter((x) => x.min >= nowMin - 30).slice(0, 3);
      const tip = now.getHours() < 10 ? "早上：核对当日补剂与用药清单；按医嘱或既定方案执行，不自行加量。"
        : now.getHours() < 14 ? "中午：午餐或午睡后，可补充餐食、睡眠记录。"
          : now.getHours() < 18 ? "下午：核对当日奶量、饮水与尿布记录是否完整。"
            : now.getHours() < 22 ? "晚上：睡前记录睡眠，并核对次日待办。"
              : "夜间：仅记录必要项，不必为打卡影响休息。";
      const sg = overview && overview.stageGuide;
      const stageItems = (sg && sg.items) ? sg.items.slice(0, 2) : [];
      return h("div", { className: "cr-card cr-time-notes", id: "cr-time-notes" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, tr("到点注意"), h("span", { className: "cr-mut" }, hhmm)),
        upcoming.length ? upcoming.map((x, i) => {
          const diff = x.min - nowMin;
          const when = diff < -30 ? "已过" : diff < 0 ? "刚过" : diff <= 60 ? "还有 " + diff + " 分" : x.time;
          return h("div", { className: "cr-time-note", key: i },
            h("b", null, x.time), h("span", null, x.label), h("i", null, when)
          );
        }) : h("div", { className: "cr-time-tip" }, tip),
        stageItems.length ? h("div", { style: { marginTop: "6px" } },
          h("div", { className: "cr-mut", style: { fontWeight: 650 } }, "本阶段 · " + (sg.label || "按阶段")),
          stageItems.map((x, i) => h("div", { className: "cr-time-stage", key: i },
            h("b", null, x.title),
            h("span", null, x.body)
          ))
        ) : null,
        ((overview && overview.carryOver) || []).length ? h("div", { style: { marginTop: "6px" } },
          h("div", { className: "cr-mut", style: { fontWeight: 650 } }, "要不要沿用"),
          overview.carryOver.map((x) => h("div", { className: "cr-carry-row", key: x.key },
            h("span", null, x.label, x.estimated ? h("em", { className: "cr-carry-est" }, "估算") : null),
            onCarryOver ? h("button", { className: "cr-btn ghost", onClick: () => onCarryOver(x) }, x.estimated ? "按这个记" : "沿用") : null
          ))
        ) : null,
        h("div", { className: "cr-mut", style: { marginTop: "6px" } }, "提示依据阶段规则，不构成诊断；用药与补剂按医嘱或既定方案执行。")
      );
    }

    function TodoFillModal({ item, onClose, onSave, onChat, busy }) {
      const [value, setValue] = useState("");
      const [err, setErr] = useState("");
      return h("div", { className: "cr-overlay", onClick: onClose },
        h("div", { className: "cr-sheet", onClick: (e) => e.stopPropagation() },
          h("h3", null, "填写待办"),
          h("div", { className: "cr-mut", style: { marginBottom: "8px", lineHeight: 1.5 } }, item.text),
          h("div", { className: "cr-field" }, h("label", null, "内容"),
            h("textarea", { value, onChange: (e) => setValue(e.target.value), placeholder: "把答案填在这里…", rows: 4 })),
          err ? h("div", { className: "cr-mut", style: { color: "#D24B36" } }, err) : null,
          h("div", { className: "cr-metrics", style: { marginTop: "8px" } },
            h("button", { className: "cr-btn primary", disabled: busy, onClick: async () => {
              if (!value.trim()) { setErr("请填写内容"); return; }
              setErr(""); await onSave(value); 
            } }, busy ? "保存中…" : "保存"),
            onChat ? h("button", { className: "cr-btn", onClick: () => onChat(item.text) }, "去对话里填") : null,
            h("button", { className: "cr-btn ghost", onClick: onClose }, "取消")
          ),
          h("div", { className: "cr-mut", style: { marginTop: "6px" } }, "保存后该待办会标记为完成，并在原条目标注答案。")
        )
      );
    }

    function TodoCard({ overview, onDone, onAdd, onFill, onChat }) {
      const t = overview && overview.todos;
      const items = (t && t.items) || [];
      const total = (t && t.total) || items.length || 0;
      const open = (t && t.open) || 0;
      const pct = total ? Math.round((total - open) / total * 100) : 0;
      return h("div", { className: "cr-card cr-todos", id: "cr-todo" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "待办", h("div", { className: "cr-metrics" },
          h("span", { className: "cr-mut" }, open + " 项待办"),
          onAdd ? h("button", { className: "cr-btn ghost", onClick: onAdd }, "加一条") : null
        )),
        total ? h("div", { className: "cr-progress" }, h("i", { style: { width: pct + "%" } })) : null,
        items.length
          ? items.slice(0, 4).map((it, i) => h("div", { key: i, className: "cr-todo-item" },
            h("button", { className: "cr-todo-check", title: "标记完成", "aria-label": "标记完成", onClick: () => onDone && onDone(it.raw || it.text) }),
            h("div", { style: { minWidth: 0, flex: 1 } },
              h("div", { className: "cr-todo-text" }, (it.date || it.time ? h("span", { className: "cr-chip", style: { marginRight: "4px" } }, (it.date ? it.date + " " : "") + (it.time || "")) : null), it.text),
              h("div", { className: "cr-recent-date" }, it.section),
              /[？?]|哪些|什么|多少|清单|时间|是否|要不要|怎么/.test(it.text) ? h("div", { className: "cr-todo-actions" },
                onFill ? h("button", { className: "cr-btn ghost", onClick: () => onFill(it) }, "填写") : null,
                onChat ? h("button", { className: "cr-btn ghost", onClick: () => onChat(it) }, "聊天里填") : null
              ) : null
            )
          ))
          : h("div", { className: "cr-empty" }, "没有待办。"),
        items.length > 4 ? h("div", { className: "cr-mut", style: { marginTop: "5px" } }, "还有 " + (items.length - 4) + " 项…") : null
      );
    }

    function JumpBar({ items, active, onPick }) {
      if (!items || !items.length) return null;
      return h("div", { className: "cr-jumps" }, items.map((x) => h("button", {
        key: x.key, title: x.full || x.label, className: "cr-jump " + (active === x.key ? "on" : ""), onClick: () => onPick(x.key),
      }, x.label, x.count ? h("span", { className: "cr-jump-badge" }, x.count) : null)));
    }

    function RecentUpdates({ overview, onTab, pending, onConfirm, onCancel, estimate, onEstimateConfirm, onEstimateDelete }) {
      const items = [];
      let seq = 0;
      const push = (date, label) => { if (date) items.push({ date, label, seq: seq++ }); };
      for (const r of (overview && overview.growthRows) || []) {
        const parts = [];
        if (r.height) parts.push(r.height + " cm");
        if (r.weight) parts.push(r.weight + " kg");
        if (parts.length) push(r.date, "生长：" + parts.join(" / "));
      }
      for (const v of (overview && overview.vaccineRows) || []) push(v.date, "疫苗：" + v.name);
      for (const m of (overview && overview.milestoneRows) || []) push(m.date, "里程碑：" + m.text);
      for (const c of (overview && overview.checkupRows) || []) push(c.date, "体检：" + c.item);
      for (const c of (overview && overview.customRecent) || []) push(c.date, "自定义：" + c.label);
      for (const r of (overview && overview.recordRows) || []) {
        const parts = [r.milk, r.poop, r.pee, r.water, r.food, r.supplement].filter(Boolean);
        if (parts.length) push(r.date, "日常：" + parts.join(" / "));
      }
      const seen = new Set();
      const list = items
        .sort((a, b) => (a.date === b.date ? b.seq - a.seq : (a.date < b.date ? 1 : -1)))
        .filter((x) => { const k = x.date + x.label; if (seen.has(k)) return false; seen.add(k); return true; })
        .slice(0, 4);
      return h("div", { className: "cr-card cr-recent cr-live", id: "cr-live" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, tr("实时更新"), h("span", { className: "cr-mut" }, "自动刷新")),
        estimate ? (() => {
          const v = estimate.values || {};
          const parts = [];
          if (v.milk) parts.push("奶 " + v.milk);
          if (v.poop) parts.push("拉 " + v.poop);
          if (v.pee) parts.push("尿 " + v.pee);
          if (v.water) parts.push("水 " + v.water);
          return h("div", { className: "cr-live-estimate" },
            h("div", { className: "cr-live-pending-head" }, estimate.proposed ? "昨天的记录" : "今日推定", h("span", null, "待核实")),
            h("div", { className: "cr-pending-text" }, estimate.proposed ? "今天还没记。昨天" + (estimate.from ? "（" + estimate.from + "）" : "") + "有：" + (parts.join(" / ") || "（无）") + "。要不要沿用？" : "今天还没记，我先按昨天" + (estimate.from ? "（" + estimate.from + "）" : "") + "记上了：" + (parts.join(" / ") || "（无）") + "。对吗？"),
            h("div", { className: "cr-metrics", style: { marginTop: "6px" } },
              h("button", { className: "cr-btn primary", onClick: onEstimateConfirm }, "对，就这样"),
              h("button", { className: "cr-btn ghost", onClick: onEstimateDelete }, "删掉")
            )
          );
        })() : null,
        pending && pending.length ? h("div", { className: "cr-live-pending", id: "cr-pending" },
          h("div", { className: "cr-live-pending-head" }, "待确认", h("span", null, pending.length + " 条")),
          pending.map((x) => h("div", { className: "cr-pending-row", key: x.id },
            h("div", { style: { minWidth: 0, flex: 1 } },
              h("div", { className: "cr-pending-text" }, x.summary),
              h("div", { className: "cr-recent-date" }, (x.kind || "记录") + " · " + (x.createdAt || ""))
            ),
            h("div", { className: "cr-metrics" },
              h("button", { className: "cr-btn primary", onClick: () => onConfirm(x.id) }, "确认"),
              h("button", { className: "cr-btn ghost", onClick: () => onCancel(x.id) }, "不记")
            )
          ))
        ) : null,
        list.length
          ? list.map((x, i) => h("div", { key: i, className: "cr-recent-item" },
            h("div", { className: "cr-recent-dot" }),
            h("div", { style: { minWidth: 0 } },
              h("div", { className: "cr-recent-label" }, x.label),
              h("div", { className: "cr-recent-date" }, x.date)
            )
          ))
          : h("div", { className: "cr-empty" }, "还没有更新。聊一句，或点「记一笔」。")
      );
    }

    // ── 图表：生长曲线 ──
    function GrowthPanel({ overview, onForm, onAll }) {
      const rows = (overview && overview.growthRows) || [];
      const [metric, setMetric] = useState("height");
      const defs = [
        { key: "height", label: "身高", unit: "cm", color: "#D24B36" },
        { key: "weight", label: "体重", unit: "kg", color: "#D24B36" },
        { key: "head", label: "头围（体检）", unit: "cm", color: "#D24B36" },
      ];
      const def = defs.find((d) => d.key === metric) || defs[0];
      const points = rows
        .map((r) => ({ date: r.date, age: r.ageMonths, value: num(r[metric]) }))
        .filter((p) => p.value !== undefined && p.value > 0)
        .sort((a, b) => (a.date < b.date ? -1 : 1));
      const latest = points[points.length - 1];
      const seriesKey = metric === "height" ? "lhfa" : metric === "weight" ? "wfa" : "hcfa";
      const refSeries = overview && overview.growthRef && overview.growthRef[seriesKey];
      const refMonths = overview && overview.growthRef && overview.growthRef.months;
      const refAt = (arr, age) => {
        if (!refSeries || !refMonths || !arr) return undefined;
        const a = Math.max(0, Math.min(refMonths.length - 1, Number(age)));
        const i0 = Math.floor(a), i1 = Math.min(refMonths.length - 1, i0 + 1), t = a - i0;
        return Number(arr[i0]) + (Number(arr[i1]) - Number(arr[i0])) * t;
      };
      const refP3 = latest ? refAt(refSeries && refSeries.p3, latest.age) : undefined;
      const refP50 = latest ? refAt(refSeries && refSeries.p50, latest.age) : undefined;
      const refP97 = latest ? refAt(refSeries && refSeries.p97, latest.age) : undefined;
      const refState = latest && [refP3, refP50, refP97].every((x) => Number.isFinite(x))
        ? (latest.value < refP3 ? "低于 P3" : latest.value > refP97 ? "高于 P97" : latest.value < refP50 ? "P3–P50" : "P50–P97")
        : "";
      const approxP = latest && [refP3, refP50, refP97].every((x) => Number.isFinite(x))
        ? (latest.value <= refP3 ? "<P3" : latest.value <= refP50 ? "P" + Math.round(3 + (latest.value - refP3) / (refP50 - refP3) * 47) : latest.value <= refP97 ? "P" + Math.round(50 + (latest.value - refP50) / (refP97 - refP50) * 47) : ">P97")
        : "";
      const bmiRow = rows.slice().reverse().find((r) => Number(r.height) > 0 && Number(r.weight) > 0);
      const bmi = bmiRow ? Number(bmiRow.weight) / Math.pow(Number(bmiRow.height) / 100, 2) : undefined;
      return h("div", { className: "cr-card", id: "cr-growth" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } },
          h("span", null, "生长曲线 · 按月龄"),
          h("div", { className: "cr-metrics" }, defs.map((d) => h("button", {
            key: d.key, className: "cr-pill " + (metric === d.key ? "on" : ""), onClick: () => setMetric(d.key),
          }, d.label))), onAll ? h("button", { className: "cr-btn ghost", onClick: () => onAll("growth") }, "全部") : null
        ),
        points.length
          ? h("div", null,
            h(LineChart, { points, unit: def.unit, color: def.color, standards: overview && overview.growthRef, metric: metric === "height" ? "lhfa" : metric === "weight" ? "wfa" : "hcfa" }),
            h("div", { className: "cr-statline" },
              h("div", { className: "cr-stat" }, h("b", null, latest.value + " " + def.unit), h("span", null, "最新 · " + latest.date)),
              h("div", { className: "cr-stat" }, h("b", null, latest.age || "—"), h("span", null, "月龄")),
              h("div", { className: "cr-stat" }, h("b", null, points.length), h("span", null, "次记录")),
              bmi !== undefined ? h("div", { className: "cr-stat" }, h("b", null, bmi.toFixed(1)), h("span", null, "BMI（仅计算）") ) : null
            ),
            h("div", { className: "cr-legend", style: { marginTop: "8px" } },
              h("span", null, h("i", { style: { background: def.color, opacity: .28 } }), "P3–P97 常见范围"),
              h("span", null, h("i", { style: { borderTop: "1px dashed " + def.color, background: "transparent" } }), "P50 中间水平"),
              h("span", null, "● 宝宝")
            ),
            h("div", { className: "cr-ref-note" },
              latest ? (() => {
                const pnum = Number(String(approxP || "").replace(/[^0-9]/g, ""));
                const pctExplain = (String(approxP || "").startsWith("P") && Number.isFinite(pnum) && pnum >= 3 && pnum <= 97)
                  ? "P" + pnum + " 的意思是：同月龄孩子里约 " + pnum + "% 比这个数值低。"
                  : "";
                const zone = !Number.isFinite(refP3) || !Number.isFinite(refP97)
                  ? "暂时没有可对照的参考范围"
                  : latest.value < refP3 ? "低于常见参考范围（P3 以下）"
                  : latest.value > refP97 ? "高于常见参考范围（P97 以上）"
                  : latest.value < refP50 ? "在常见参考范围内，属于中间偏下"
                  : "在常见参考范围内，属于中间偏上";
                return "参考结论：" + latest.age + " 月龄 " + latest.value + " " + def.unit + "，约 " + (approxP || "—") + "。" + pctExplain + " " + zone + "。" +
                  (zone.startsWith("在常见参考") ? "通常不算异常，但单次测量不诊断，看趋势更重要。" : "单次测量不能直接下结论，建议结合趋势，必要时问儿保。") +
                  "早产、双胎或特殊病史请按儿保医生的参考标准看。";
              })() : "暂无参考结论。"
            ),
            h("div", { className: "cr-mut", style: { marginTop: "4px" } }, "参考带：WHO 0–5 岁标准 P3–P97；中国可对照 WS/T 423—2022。只作参考，不诊断。")
          )
          : h("div", { className: "cr-empty" }, "还没有" + def.label + "数据。记一次就有曲线。",
            h("div", { style: { marginTop: "8px" } }, h("button", { className: "cr-btn primary", onClick: () => onForm("growth") }, "记一次")))
      );
    }

    function LineChart({ points, unit, color, standards, metric }) {
      const W = 600, H = 190;
      const pad = { l: 38, r: 14, t: 14, b: 26 };
      const series = standards && standards[metric] ? standards[metric] : null;
      const aged = points.every((p) => Number.isFinite(Number(p.age)));
      const vals = points.map((p) => Number(p.value)).filter((v) => Number.isFinite(v));
      if (series && aged) {
        series.p3.forEach((v) => vals.push(v));
        series.p97.forEach((v) => vals.push(v));
        points.forEach((p) => vals.push(Number(p.value)));
        let min = Math.min(...vals), max = Math.max(...vals);
        const span = max - min || 1;
        min -= span * 0.08; max += span * 0.08;
        // 取整刻度，别让纵轴出现 41.1 / 90.3 这种难读数字
        const rawStep = (max - min) / 4;
        const pow = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
        const n = rawStep / pow;
        const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
        min = Math.floor(min / step) * step;
        max = Math.ceil(max / step) * step;
        const maxAge = Math.max(36, ...points.map((p) => Number(p.age)));
        const x = (age) => pad.l + (Number(age) / maxAge) * (W - pad.l - pad.r);
        const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
        const ticks = Math.max(2, Math.round((max - min) / step));
        const grid = [];
        for (let i = 0; i <= ticks; i++) {
          const v = min + step * i;
          const yy = y(v);
          grid.push(h("line", { key: "g" + i, x1: pad.l, x2: W - pad.r, y1: yy, y2: yy, stroke: "var(--dsw-alias-border-l1,rgba(0,0,0,.10))", strokeWidth: 1 }));
          grid.push(h("text", { key: "t" + i, x: 4, y: yy + 3 }, fmt(v)));
        }
        const months = (standards && Array.isArray(standards.months) ? standards.months : null) || (Array.isArray(series.months) ? series.months : []) || [];
        if (!months.length) {
          // 数据不完整时退回普通折线，别让整个面板崩掉
          return null;
        }
        const p3 = months.map((m, i) => (i ? "L" : "M") + x(m) + " " + y(series.p3[i])).join(" ");
        const p97 = months.slice().reverse().map((m, i) => "L" + x(m) + " " + y(series.p97[months.length - 1 - i])).join(" ");
        const median = months.map((m, i) => (i ? "L" : "M") + x(m) + " " + y(series.p50[i])).join(" ");
        const user = points.slice().sort((a, b) => Number(a.age) - Number(b.age));
        const upath = user.map((p, i) => (i ? "L" : "M") + x(Number(p.age)) + " " + y(Number(p.value))).join(" ");
        const xTicks = [0, 12, 24, 36].filter((m) => m <= maxAge);
        return h("svg", { viewBox: "0 0 " + W + " " + H, className: "cr-chart" },
          grid,
          h("path", { d: p3 + " " + p97 + " Z", fill: color, opacity: 0.10 }),
          h("path", { d: median, fill: "none", stroke: color, strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.55 }),
          h("path", { d: upath, fill: "none", stroke: color, strokeWidth: 2.2, strokeLinejoin: "round", strokeLinecap: "round" }),
          user.map((p, i) => h("circle", { key: "p" + i, cx: x(Number(p.age)), cy: y(Number(p.value)), r: 3.4, fill: "#FAFAFA", stroke: color, strokeWidth: 2 })),
          xTicks.map((m) => h("text", { key: "x" + m, x: x(m), y: H - 8, textAnchor: m === 0 ? "start" : "middle" }, m + " 月")),
          h("text", { x: W - pad.r, y: 10, textAnchor: "end" }, unit)
        );
      }
      // fallback：没有参考数据/月龄时按记录顺序画
      let min = Math.min(...vals), max = Math.max(...vals);
      if (max === min) { min -= 1; max += 1; }
      const span = max - min;
      min -= span * 0.15; max += span * 0.15;
      const x = (i) => pad.l + (points.length === 1 ? (W - pad.l - pad.r) / 2 : i * (W - pad.l - pad.r) / (points.length - 1));
      const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
      const path = points.map((p, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(Number(p.value)).toFixed(1)).join(" ");
      const grid = [];
      for (let i = 0; i <= 4; i++) {
        const v = min + (max - min) * i / 4;
        const yy = y(v);
        grid.push(h("line", { key: "g" + i, x1: pad.l, x2: W - pad.r, y1: yy, y2: yy, stroke: "var(--dsw-alias-border-l1,rgba(0,0,0,.10))", strokeWidth: 1 }));
        grid.push(h("text", { key: "t" + i, x: 4, y: yy + 3 }, fmt(v)));
      }
      return h("svg", { viewBox: "0 0 " + W + " " + H, className: "cr-chart" },
        grid,
        h("path", { d: path, fill: "none", stroke: color, strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" }),
        points.map((p, i) => h("circle", { key: "p" + i, cx: x(i), cy: y(Number(p.value)), r: 3.4, fill: "#FAFAFA", stroke: color, strokeWidth: 2 })),
        h("text", { x: W - pad.r, y: 10, textAnchor: "end" }, unit)
      );
    }

    function fmt(v) {
      if (Math.abs(v) >= 100) return String(Math.round(v));
      return (Math.round(v * 10) / 10).toFixed(1);
    }

    // ── 表：日常 / 疫苗 / 体检 / 里程碑 / 补剂 / 用药 / 总汇总 ──
    function fmtMilk(r) {
      const ml = r.milkMl || 0;
      const n = r.milkCount || 0;
      if (ml && n) return ml + "ml / " + n + " 次";
      if (ml) return ml + "ml";
      if (n) return n + " 次";
      return "—";
    }

    function BarChart({ items, unit, color }) {
      if (!items || !items.length) return null;
      const W = 600, H = 150, pad = { l: 38, r: 10, t: 12, b: 24 };
      const max = Math.max(...items.map((x) => Number(x.value) || 0), 1);
      const bw = Math.min(34, (W - pad.l - pad.r) / Math.max(items.length, 1) * 0.62);
      const x = (i) => pad.l + (i + 0.5) * (W - pad.l - pad.r) / items.length;
      const y = (v) => pad.t + (1 - (Number(v) || 0) / max) * (H - pad.t - pad.b);
      return h("svg", { viewBox: "0 0 " + W + " " + H, className: "cr-chart" },
        [0, 0.5, 1].map((f, i) => {
          const v = max * f; const yy = y(v);
          return h("g", { key: i }, h("line", { x1: pad.l, x2: W - pad.r, y1: yy, y2: yy, stroke: "var(--dsw-alias-border-l1,rgba(0,0,0,.10))" }), h("text", { x: 3, y: yy + 3 }, fmt(v)));
        }),
        items.map((it, i) => h("g", { key: i },
          h("rect", { x: x(i) - bw / 2, y: y(it.value), width: bw, height: Math.max(1, y(0) - y(it.value)), fill: color, rx: 3, opacity: 0.82 }),
          items.length <= 8 && Number(it.value) > 0 ? h("text", { x: x(i), y: Math.max(8, y(it.value) - 3), textAnchor: "middle", className: "cr-chart-value" }, fmt(it.value)) : null
        )),
        items.map((it, i) => (items.length <= 12 || i % Math.ceil(items.length / 8) === 0) ? h("text", { key: "l" + i, x: x(i), y: H - 7, textAnchor: "middle" }, it.label) : null),
        h("text", { x: W - pad.r, y: 10, textAnchor: "end" }, unit || "")
      );
    }

    function DonutChart({ segments, center, size }) {
      const total = (segments || []).reduce((a, x) => a + (Number(x.value) || 0), 0) || 1;
      const r = 15.9, circ = 2 * Math.PI * r;
      let offset = 0;
      return h("svg", { viewBox: "0 0 42 42", width: size || 64, height: size || 64, className: "cr-donut" },
        h("circle", { cx: 21, cy: 21, r, fill: "none", stroke: "rgba(0,0,0,.10)", strokeWidth: 4 }),
        (segments || []).map((x, i) => {
          const len = (Number(x.value) || 0) / total * circ;
          const el = h("circle", { key: i, cx: 21, cy: 21, r, fill: "none", stroke: x.color, strokeWidth: 4, strokeDasharray: len + " " + (circ - len), strokeDashoffset: -offset, transform: "rotate(-90 21 21)", strokeLinecap: "butt" });
          offset += len;
          return el;
        }),
        h("text", { x: 21, y: 22.5, textAnchor: "middle", className: "cr-donut-center" }, center || "")
      );
    }

    function ExpensePanel({ overview, onForm, onAll, onSaveEstimate }) {
      const [gran, setGran] = useState("day");
      const rows = (overview && overview.expenseRows) || [];
      const s = (overview && overview.expenseSummary) || { total: 0, count: 0, monthTotal: 0, monthCount: 0, byCategory: [], byMonth: [] };
      const est = (overview && overview.expenseEstimate) || null;
      const auto = (s && s.autoEstimate) || null;
      const autoOk = !!(auto && auto.ok && auto.items && auto.items.length);
      const showAuto = autoOk && (rows.length === 0 || (s.actualCount > 0 && !s.estimatedCount));
      const estimatedCombined = (Number(s.estimatedTotal) || 0) + (showAuto ? (Number(auto.monthly) || 0) : 0);
      const money = (v) => "¥" + Math.round(Number(v) || 0).toLocaleString("zh-CN");
      return h("div", { className: "cr-card", id: "cr-expense" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "育儿花费 · 按月",
          h("div", { className: "cr-metrics" },
            h("button", { className: "cr-btn ghost", onClick: () => onForm("expense") }, "记一笔"),
            onAll ? h("button", { className: "cr-btn ghost", onClick: () => onAll("expense") }, "全部") : null)),
        h("div", { className: "cr-statline" },
          h("div", { className: "cr-stat" }, h("b", null, money(s.actualTotal)), h("span", null, "实际累计")),
          h("div", { className: "cr-stat" }, h("b", null, money(estimatedCombined)), h("span", null, "预估")),
          h("div", { className: "cr-stat" }, h("b", null, money(s.monthTotal)), h("span", null, "本月实际")),
          h("div", { className: "cr-stat" }, h("b", null, s.count), h("span", null, "笔实际记录"))
        ),
        (!showAuto && s.estimatedTotal > 0) ? h("div", { className: "cr-expense-est" },
          h("div", { className: "cr-live-pending-head" }, "已保存预估", h("span", null, "不计入实际")),
          h("div", { className: "cr-sum-value" }, money(s.estimatedTotal) + " / 月"),
          h("div", { className: "cr-mut", style: { lineHeight: 1.6 } }, "这是你保存的预估，不是实际支出；记了实际花费后，实际记录优先，预估单独保留。")
        ) : null,
        showAuto ? h("div", { className: "cr-expense-est" },
          h("div", { className: "cr-live-pending-head" }, s.actualCount > 0 ? "没记实际的花费 · 按活动估算" : "暂无花费记录，以下为阶段估算", h("span", null, "不是实际支出")),
          h("div", { className: "cr-sum-value" }, money(auto.monthly) + " / 月"),
          h("div", { className: "cr-mut", style: { lineHeight: 1.6 } }, auto.items.map((x) => x.category + " " + money(x.amount)).join(" · ")),
          h("div", { className: "cr-mut", style: { marginTop: "4px" } }, (auto.assumptions || []).join("；") + "。"),
          h("div", { className: "cr-metrics", style: { marginTop: "6px" } },
            h("button", { className: "cr-btn primary", onClick: () => onForm("expense") }, "记一笔实际"),
            onSaveEstimate ? h("button", { className: "cr-btn", onClick: () => onSaveEstimate(auto) }, "保存估算") : null
          )
        ) : (rows.length === 0 ? h("div", { className: "cr-empty" }, "暂无花费记录。可点「记一笔」录入实际支出；未录入时按活动记录估算。") : null),
        s.byMonth.length ? h("div", { style: { marginTop: "10px" } },
          h("div", { className: "cr-sec" }, "花费汇总 · 按" + (GRAN_OPTIONS.find((x) => x[0] === gran) || ["", "月"])[1], h("span", { className: "cr-mut" }, "只记账，不做理财建议")),
          h("div", { className: "cr-metrics", style: { marginBottom: "4px" } }, GRAN_OPTIONS.map(([k, label]) => h("button", { key: k, className: "cr-pill " + (gran === k ? "on" : ""), onClick: () => setGran(k) }, "按" + label))),
          h(BarChart, { items: aggregateSeries(rows, (r) => r.date, (r) => r.amount, gran), unit: "元", color: "#D24B36" })
        ) : null,
        s.byCategory.length ? h("div", { style: { marginTop: "10px" } },
          h("div", { className: "cr-sec" }, "分类汇总", h("span", { className: "cr-mut" }, "按已记花费")),
          h("div", { className: "cr-table-wrap" }, h("table", { className: "cr-table" },
            h("thead", null, h("tr", null, ["类别", "金额", "占比", "笔数"].map((x) => h("th", { key: x, className: x === "金额" || x === "占比" || x === "笔数" ? "num" : "" }, x)))),
            h("tbody", null, s.byCategory.map((x) => h("tr", { key: x.category },
              h("td", null, x.category), h("td", { className: "num" }, money(x.amount)),
              h("td", { className: "num" }, s.total ? Math.round(x.amount / s.total * 100) + "%" : "—"),
              h("td", { className: "num" }, x.count)
            )))
          ))
        ) : null,
        rows.length ? h("div", { style: { marginTop: "10px" } },
          h("div", { className: "cr-sec" }, "最近记录"),
          h("div", { className: "cr-table-wrap" }, h("table", { className: "cr-table" },
            h("thead", null, h("tr", null, ["日期", "类别", "项目", "商品", "金额", "支付人"].map((x) => h("th", { key: x, className: x === "金额" ? "num" : "" }, x)))),
            h("tbody", null, rows.slice().reverse().slice(0, 8).map((r, i) => h("tr", { key: i },
              h("td", null, r.date || "—"), h("td", null, r.category || "—"), h("td", null, r.item || "—"),
              h("td", { className: "dim" }, r.product || "—"), h("td", { className: "num" }, money(r.amount)), h("td", { className: "dim" }, r.payer || "—")
            )))
          ))
        ) : null,
        h("div", { className: "cr-mut", style: { marginTop: "8px" } }, "奶量、尿布、餐食与体检数据参与估算。已录入金额优先；未录入时按月估算，估算不代表实际支出或当地实时物价。")
      );
    }

    function MultiBarChart({ items }) {
      if (!items || !items.length) return null;
      const W = 600, H = 190, pad = { l: 40, r: 40, t: 14, b: 26 };
      const maxMl = Math.max(...items.map((x) => Math.max(Number(x.milk) || 0, Number(x.water) || 0)), 1);
      const maxCt = Math.max(...items.map((x) => Math.max(Number(x.poop) || 0, Number(x.pee) || 0)), 1);
      const x0 = (i) => pad.l + (i + 0.5) * (W - pad.l - pad.r) / items.length;
      const yL = (v) => pad.t + (1 - (Number(v) || 0) / maxMl) * (H - pad.t - pad.b);
      const yR = (v) => pad.t + (1 - (Number(v) || 0) / maxCt) * (H - pad.t - pad.b);
      const bw = Math.min(12, (W - pad.l - pad.r) / items.length * 0.62 / 4);
      const bars = [
        { key: "milk", color: CR_PALETTE.terracotta, y: yL },
        { key: "poop", color: CR_PALETTE.ochre, y: yR },
        { key: "water", color: CR_PALETTE.slate, y: yL },
        { key: "pee", color: CR_PALETTE.plum, y: yR },
      ];
      return h("svg", { viewBox: "0 0 " + W + " " + H, className: "cr-chart" },
        [0, 0.5, 1].map((f, i) => h("g", { key: "g" + i },
          h("line", { x1: pad.l, x2: W - pad.r, y1: yL(maxMl * f), y2: yL(maxMl * f), stroke: "rgba(0,0,0,.10)" }),
          h("text", { x: 3, y: yL(maxMl * f) + 3 }, fmt(maxMl * f)),
          h("text", { x: W - 2, y: yL(maxMl * f) + 3, textAnchor: "end" }, fmt(maxCt * f))
        )),
        items.map((it, i) => bars.map((b, j) => h("rect", {
          key: b.key + i, x: x0(i) + (j - 1.5) * bw, width: bw, y: b.y(it[b.key]),
          height: Math.max(1, yL(0) - b.y(it[b.key])), fill: b.color, rx: 2,
        }))),
        items.map((it, i) => (items.length <= 12 || i % Math.ceil(items.length / 8) === 0) ? h("text", { key: "x" + i, x: x0(i), y: H - 7, textAnchor: "middle" }, it.label) : null),
        h("text", { x: pad.l, y: 10 }, "ml"),
        h("text", { x: W - pad.r, y: 10, textAnchor: "end" }, "次")
      );
    }

    function MilkStackChart({ rows, gran }) {
      if (!rows || !rows.length) return null;
      const colors = [CR_PALETTE.plum, CR_PALETTE.terracotta, CR_PALETTE.slate, CR_PALETTE.ochre, CR_PALETTE.rose, "#000000"];
      const types = [...new Set(rows.map((r) => r.type || "其他"))];
      const map = new Map();
      for (const r of rows) {
        const key = periodKey(r.date, gran);
        if (!key) continue;
        const cur = map.get(key) || { key, total: 0, byType: {} };
        const v = Number(r.amount) || 0;
        cur.total += v; cur.byType[r.type || "其他"] = (cur.byType[r.type || "其他"] || 0) + v;
        map.set(key, cur);
      }
      const items = [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1)).slice(-12);
      if (!items.length) return null;
      const W = 600, H = 150, pad = { l: 38, r: 12, t: 12, b: 24 };
      const max = Math.max(...items.map((x) => x.total), 1);
      const bw = Math.min(26, (W - pad.l - pad.r) / items.length * 0.6);
      const x = (i) => pad.l + (i + 0.5) * (W - pad.l - pad.r) / items.length;
      const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
      return h("div", null,
        h("svg", { viewBox: "0 0 " + W + " " + H, className: "cr-chart" },
          [0, 0.5, 1].map((f, i) => h("g", { key: i }, h("line", { x1: pad.l, x2: W - pad.r, y1: y(max * f), y2: y(max * f), stroke: "rgba(0,0,0,.10)" }), h("text", { x: 3, y: y(max * f) + 3 }, fmt(max * f)))),
          items.map((it, i) => {
            let base = 0;
            return types.map((t, j) => {
              const v = it.byType[t] || 0; if (!v) return null;
              const hgt = y(0) - y(v); const rect = h("rect", { key: t + i, x: x(i) - bw / 2, y: y(base + v), width: bw, height: hgt, fill: colors[j % colors.length] });
              base += v; return rect;
            });
          }),
          items.length <= 10 ? items.map((it, i) => h("text", { key: "v" + i, x: x(i), y: Math.max(9, y(it.total) - 3), textAnchor: "middle", className: "cr-chart-value" }, fmt(it.total))) : null,
          items.map((it, i) => h("text", { key: "x" + i, x: x(i), y: H - 7, textAnchor: "middle" }, it.key.slice(5)))
        ),
        h("div", { className: "cr-legend" }, types.map((t, i) => h("span", { key: t }, h("i", { style: { background: colors[i % colors.length] } }), t)))
      );
    }

    function SleepPanel({ overview, onForm, onAll }) {
      const s = (overview && overview.sleepSummary) || { count: 0, avgMinutes: 0, totalMinutes: 0, nightWakes: 0, byDay: [] };
      const rows = (overview && overview.sleepRows) || [];
      const dur = (m) => Math.floor((Number(m) || 0) / 60) + "h " + ((Number(m) || 0) % 60) + "m";
      return h("div", { className: "cr-card", id: "cr-sleep" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "睡眠 · 按段", h("div", { className: "cr-metrics" },
          h("button", { className: "cr-btn ghost", onClick: () => onForm("sleepLog") }, "记睡眠"),
          onAll ? h("button", { className: "cr-btn ghost", onClick: () => onAll("sleepLog") }, "全部") : null)),
        h("div", { className: "cr-statline" },
          h("div", { className: "cr-stat" }, h("b", null, dur(s.avgMinutes)), h("span", null, "平均每段")),
          h("div", { className: "cr-stat" }, h("b", null, dur(s.totalMinutes)), h("span", null, "累计")),
          h("div", { className: "cr-stat" }, h("b", null, s.nightWakes), h("span", null, "夜醒次数"))
        ),
        s.byDay && s.byDay.length ? h("div", { style: { marginTop: "6px" } },
          h("div", { className: "cr-mut" }, "最近 7 天 · 每天总睡眠"),
          h(BarChart, { items: s.byDay.slice().reverse().map((x) => ({ label: x.date.slice(5), value: Math.round((Number(x.minutes) || 0) / 60 * 10) / 10 })), unit: "小时", color: CR_PALETTE.plum })
        ) : null,
        rows.length ? h("div", { className: "cr-table-wrap", style: { marginTop: "8px" } }, h("table", { className: "cr-table" },
          h("thead", null, h("tr", null, ["日期", "类型", "入睡-醒来", "时长", "夜醒"].map((x) => h("th", { key: x, className: ["时长", "夜醒"].includes(x) ? "num" : "" }, x)))),
          h("tbody", null, rows.slice(0, 8).map((r, i) => h("tr", { key: i },
            h("td", null, r.date), h("td", null, r.type || "夜间"), h("td", null, (r.start || "—") + " - " + (r.end || "—")),
            h("td", { className: "num" }, dur(r.minutes)), h("td", { className: "num" }, r.nightWakes || 0)
          )))
        )) : h("div", { className: "cr-empty" }, "还没有睡眠记录。"),
        h("div", { className: "cr-mut", style: { marginTop: "5px" } }, "只记录睡眠，不评价好坏；长期睡眠问题请咨询儿保。")
      );
    }

    function SupplementSummaryCard({ overview, onForm }) {
      const s = (overview && overview.supplementSummary) || { byNutrient: [], count: 0 };
      if (!s.byNutrient.length) return null;
      return h("div", { className: "cr-milk-break" },
        h("div", { className: "cr-live-pending-head" }, "补剂成分合计", h("span", null, "按已录入成分合计")),
        h("div", { className: "cr-table-wrap" }, h("table", { className: "cr-table" },
          h("thead", null, h("tr", null, ["成分", "总量", "次数"].map((x) => h("th", { key: x, className: x === "成分" ? "" : "num" }, x)))),
          h("tbody", null, s.byNutrient.map((x) => h("tr", { key: x.name + x.unit },
            h("td", null, x.name), h("td", { className: "num" }, Math.round(x.amount * 100) / 100 + (x.unit || "")), h("td", { className: "num" }, x.count)
          )))
        )),
        h("div", { className: "cr-mut", style: { marginTop: "4px" } }, "仅统计已录入成分，不作为推荐摄入量；未录入成分的补剂不参与合计。"),
        h("div", { className: "cr-metrics" }, h("button", { className: "cr-btn ghost", onClick: () => onForm("supplementDetail") }, "记补剂成分"))
      );
    }

    function MilkBreakdown({ overview, onForm, onAll }) {
      const rows = (overview && overview.milkRows) || [];
      const s = (overview && overview.milkSummary) || { total: 0, byType: [] };
      if (!rows.length) return null;
      const colors = [CR_PALETTE.plum, CR_PALETTE.terracotta, CR_PALETTE.slate, CR_PALETTE.ochre, CR_PALETTE.rose, "#000000"];
      return h("div", { className: "cr-milk-break" },
        h("div", { className: "cr-live-pending-head" }, "奶记录分段", h("span", null, "母乳 / 配方奶 / 水奶 / 牛奶 / 羊奶")),
        h("div", { className: "cr-seg-bar" }, s.byType.map((x, i) => h("i", { key: x.type, style: { width: (s.total ? x.amount / s.total * 100 : 0) + "%", background: colors[i % colors.length] } }))),
        h("div", { className: "cr-milk-legend" }, s.byType.map((x, i) => h("span", { key: x.type },
          h("i", { style: { background: colors[i % colors.length] } }),
          x.type + " " + Math.round(x.amount) + "ml · " + (s.total ? Math.round(x.amount / s.total * 100) : 0) + "%"
        ))),
        h("div", { className: "cr-metrics" }, h("button", { className: "cr-btn ghost", onClick: () => onForm("milkDetail") }, "记奶"),
          onAll ? h("button", { className: "cr-btn ghost", onClick: () => onAll("milkDetail") }, "全部") : null)
      );
    }

    function DailyTablePanel({ overview, onForm, onAll }) {
      const [gran, setGran] = useState("day");
      const [showDetail, setShowDetail] = useState(false);
      const chartDefs = [["milkMl", "奶", "ml"], ["waterMl", "水", "ml"], ["poopCount", "拉", "次"], ["peeCount", "尿", "次"]];
      const rows = (overview && overview.recordRows) || [];
      const actualRows = rows.filter((r) => !r.inferred);
      const dailyEvents = (overview && overview.dailyEvents) || [];
      const milkRows = (overview && overview.milkRows) || [];
      const combinedMap = new Map();
      for (const r of actualRows) {
        const key = periodKey(r.date, gran);
        if (!key) continue;
        const cur = combinedMap.get(key) || { key, milk: 0, water: 0, poop: 0, pee: 0 };
        cur.milk += Number(r.milkMl) || 0;
        cur.water += Number(r.waterMl) || 0;
        cur.poop += Number(r.poopCount) || 0;
        cur.pee += Number(r.peeCount) || 0;
        combinedMap.set(key, cur);
      }
      const combined = [...combinedMap.values()].sort((a, b) => (a.key < b.key ? -1 : 1));
      const agg = (overview && overview.dailyAggregates) || null;
      const aggTable = (title, items, total) => h("div", { style: { marginTop: "8px" } },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, title),
        h("div", { className: "cr-table-wrap" },
          h("table", { className: "cr-table" },
            h("thead", null, h("tr", null, ["期间", "记录", "奶", "拉", "尿", "水", "补剂"].map((x) => h("th", { key: x, className: ["记录", "奶", "拉", "尿", "水", "补剂"].includes(x) ? "num" : "" }, x)))),
            h("tbody", null, items.map((r) => h("tr", { key: r.key },
              h("td", null, r.key), h("td", { className: "num" }, r.days + " 天"),
              h("td", { className: "num" }, fmtMilk(r)),
              h("td", { className: "num" }, r.poopCount ? r.poopCount + " 次" : "—"),
              h("td", { className: "num" }, r.peeCount ? r.peeCount + " 次" : "—"),
              h("td", { className: "num" }, r.waterMl ? r.waterMl + "ml" : "—"),
              h("td", { className: "num" }, r.supplementDays ? r.supplementDays + " 天" : "—")
            ))),
            total ? h("tfoot", null, h("tr", null,
              h("td", null, "总计"), h("td", { className: "num" }, total.days + " 天"),
              h("td", { className: "num" }, fmtMilk(total)),
              h("td", { className: "num" }, total.poopCount ? total.poopCount + " 次" : "—"),
              h("td", { className: "num" }, total.peeCount ? total.peeCount + " 次" : "—"),
              h("td", { className: "num" }, total.waterMl ? total.waterMl + "ml" : "—"),
              h("td", { className: "num" }, total.supplementDays ? total.supplementDays + " 天" : "—")
            )) : null
          )
        )
      );
      const totals = actualRows.reduce((a, r) => {
        a.milkMl += r.milkMl || 0; a.milkCount += r.milkCount || 0;
        a.poopCount += r.poopCount || 0; a.peeCount += r.peeCount || 0;
        a.waterMl += r.waterMl || 0; a.waterCount += r.waterCount || 0;
        if (r.supplement) a.supplementDays += 1;
        return a;
      }, { milkMl: 0, milkCount: 0, poopCount: 0, peeCount: 0, waterMl: 0, waterCount: 0, supplementDays: 0 });
      const headers = [
        { l: "日期" }, { l: "月龄", num: 1 }, { l: "奶", num: 1 }, { l: "拉", num: 1 }, { l: "尿", num: 1 },
        { l: "水", num: 1 }, { l: "补剂" }, { l: "时间点" },
      ];
      const shown = rows.slice(0, 7);
      return h("div", { className: "cr-card", id: "cr-daily" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "日常表 · 按天", h("div", { className: "cr-metrics" }, h("button", { className: "cr-btn ghost", onClick: () => onForm("record") }, "记一笔"), onAll ? h("button", { className: "cr-btn ghost", onClick: () => onAll("daily") }, "全部") : null)),
        h(RoutineSummaryCard, { overview, embedded: true }),
        agg ? h("div", { style: { marginTop: "10px" } },
          h("div", { className: "cr-sec" }, "汇总 · 按月/年", h("span", { className: "cr-mut" }, "日记录归集")),
          agg.months.length ? h("div", null,
            h("div", { className: "cr-metrics" }, GRAN_OPTIONS.map(([k, label]) => h("button", { key: k, className: "cr-pill " + (gran === k ? "on" : ""), onClick: () => setGran(k) }, "按" + label))),
            h("div", { className: "cr-mut", style: { marginTop: "4px" } }, "按" + (GRAN_OPTIONS.find((x) => x[0] === gran) || ["", "月"])[1] + " · 四项同时看"),
            h("div", { className: "cr-mini-grid" }, chartDefs.map(([k, label, unit]) => h("div", { className: "cr-mini-chart", key: k },
              h("div", { className: "cr-mini-title" }, label + " · " + unit),
              k === "milkMl" && milkRows.length
                ? h(MilkStackChart, { rows: milkRows, gran })
                : h(BarChart, { items: aggregateSeries(actualRows, (r) => r.date, (r) => r[k], gran), unit, color: "#D24B36" })
            ))),
            h("div", { className: "cr-sec", style: { marginTop: "10px" } }, "四项同图 · 每个时间四根柱子", h("span", { className: "cr-mut" }, "左轴 ml · 右轴 次")),
            h(MultiBarChart, { items: combined }),
            h("div", { className: "cr-legend" },
              h("span", null, h("i", { style: { background: "#D24B36" } }), "奶 ml"),
              h("span", null, h("i", { style: { background: CR_PALETTE.ochre } }), "拉 次"),
              h("span", null, h("i", { style: { background: CR_PALETTE.slate } }), "水 ml"),
              h("span", null, h("i", { style: { background: "rgba(0,0,0,.45)" } }), "尿 次")
            ),
          ) : null,
          agg.months.length ? aggTable("按月小计", agg.months.slice(0, 24), agg.total) : null,
          agg.years.length ? aggTable("按年小计", agg.years, agg.total) : null
        ) : null,
        h("div", { className: "cr-sec" }, "详细记录 · 按时刻", h("button", { className: "cr-btn ghost", onClick: () => setShowDetail(!showDetail) }, showDetail ? "收起" : "展开")),
        rows.length
          ? (showDetail ? h("div", { className: "cr-table-wrap" },
            h("table", { className: "cr-table cr-daily-events" },
              h("colgroup", null, ["56px", "48px", "48px", "48px", "48px", "auto"].map((w, i) => h("col", { key: i, style: { width: w } }))),
              h("thead", null, h("tr", null, ["时间", "奶", "拉", "尿", "水", "补剂"].map((x) => h("th", { key: x, className: ["奶", "拉", "尿", "水"].includes(x) ? "num" : "" }, x)))),
              h("tbody", null, shown.flatMap((r) => {
                const eventNum = (v) => Number(String(v == null ? "" : v).match(/\d+(?:\.\d+)?/)?.[0] || 0);
                const makeEvent = (time, category, content) => {
                  const n = eventNum(content);
                  return {
                    time: time || "—", category: category || "—", content,
                    milk: category.includes("奶") ? n : 0,
                    poop: category.includes("拉") ? n : 0,
                    pee: category.includes("尿") ? n : 0,
                    water: category.includes("水") ? n : 0,
                    supplement: category.includes("补剂") ? content : "",
                    food: category.includes("辅食") || category.includes("食物") ? content : "",
                  };
                };
                const dayEvents = dailyEvents.filter((e) => e.date === r.date);
                const raw = dayEvents.length ? dayEvents.map((e) => makeEvent(e.time, e.category, [e.amount, e.note].filter(Boolean).join(" · ") || "—"))
                  : String(r.time || "").split(/[；;\n]+/).map((x) => x.trim()).filter(Boolean).map((part) => {
                    const m = part.match(/^(\d{1,2}:\d{2})\s*(.*)$/);
                    const text = m ? (m[2] || "记录") : part;
                    const cat = /奶/.test(text) ? "奶" : /水/.test(text) ? "水" : /拉/.test(text) ? "拉" : /尿/.test(text) ? "尿" : /补剂|AD|D3/.test(text) ? "补剂" : /午饭|辅食|饭/.test(text) ? "辅食" : "—";
                    return makeEvent(m ? m[1] : "—", cat, text);
                  });
                const grouped = new Map();
                for (const e of raw) {
                  const g = grouped.get(e.time) || { time: e.time, milk: 0, poop: 0, pee: 0, water: 0, food: [], supplement: [] };
                  g.milk += e.milk; g.poop += e.poop; g.pee += e.pee; g.water += e.water;
                  if (e.food) g.food.push(e.food);
                  if (e.supplement) g.supplement.push(e.supplement);
                  grouped.set(e.time, g);
                }
                const parts = [...grouped.values()].map((g) => ({ ...g, food: g.food.join("；"), supplement: g.supplement.join("、") }));
                const rowsForDay = [h("tr", { key: "day-" + r.date, className: "cr-day-row" },
                  h("td", { colSpan: 6 }, r.date + " · " + (r.months || "—") + " 月龄")
                )];
                parts.forEach((part, i) => {
                  rowsForDay.push(h("tr", { key: "e-" + r.date + "-" + i },
                    h("td", { className: "num dim" }, part.time),
                    h("td", { className: "num" }, part.milk ? Math.round(part.milk) : ""),
                    h("td", { className: "num" }, part.poop ? Math.round(part.poop) : ""),
                    h("td", { className: "num" }, part.pee ? Math.round(part.pee) : ""),
                    h("td", { className: "num" }, part.water ? Math.round(part.water) : ""),
                    h("td", { className: "num" }, part.supplement || "")
                  ));
                });
                rowsForDay.push(h("tr", { key: "sum-" + r.date, className: "cr-subtotal-row" },
                  h("td", null, "小计"),
                  h("td", { className: "num" }, fmtMilk(r)), h("td", { className: "num" }, r.poop || "—"),
                  h("td", { className: "num" }, r.pee || "—"), h("td", { className: "num" }, r.water || "—"),
                  h("td", null, r.supplement || "—")
                ));
                return rowsForDay;
              })),
              h("tfoot", null, h("tr", null,
                h("td", null, "合计"),
                h("td", { className: "num" }, fmtMilk(totals)),
                h("td", { className: "num" }, totals.poopCount ? totals.poopCount + " 次" : "—"),
                h("td", { className: "num" }, totals.peeCount ? totals.peeCount + " 次" : "—"),
                h("td", { className: "num" }, totals.waterMl ? totals.waterMl + "ml" : "—"),
                h("td", null, totals.supplementDays ? totals.supplementDays + " 天" : "—")
              ))
            )
          ) : h("div", { className: "cr-mut", style: { marginTop: "4px" } }, "详细记录已收起 · 点「展开」看每个时刻"))
          : h("div", { className: "cr-empty" }, "还没有记录。",
            h("div", { style: { marginTop: "8px" } }, h("button", { className: "cr-btn primary", onClick: () => onForm("record") }, "记一笔"))),
        h(MilkBreakdown, { overview, onForm, onAll }),
        h(SupplementSummaryCard, { overview, onForm }),
        rows.length > 7 ? h("div", { className: "cr-mut", style: { marginTop: "6px" } }, "上面是最近 7 天；全部 " + rows.length + " 天在「全部」里。") : null,
        h("div", { className: "cr-mut", style: { marginTop: "6px" } }, "一天一行；同天多次合并，合计自动算；月/年小计和总计从全部日常记录算。")
      );
    }

    function RoutineSummaryCard({ overview, embedded }) {
      const [range, setRange] = useState("week");
      const r = (overview && overview.routine && overview.routine[range]) || {};
      return h("div", { className: embedded ? "cr-routine-embedded" : "cr-card", id: "cr-routine" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, range === "week" ? "本周合计" : "近 30 天",
          h("div", { className: "cr-metrics" },
            h("button", { className: "cr-pill " + (range === "week" ? "on" : ""), onClick: () => setRange("week") }, "7 天"),
            h("button", { className: "cr-pill " + (range === "month" ? "on" : ""), onClick: () => setRange("month") }, "30 天")
          )
        ),
        h("div", { className: "cr-statline" },
          h("div", { className: "cr-stat" }, h("b", null, fmtMilk(r)), h("span", null, "奶")),
          h("div", { className: "cr-stat" }, h("b", null, (r.poopCount || 0) ? r.poopCount + " 次" : "—"), h("span", null, "拉")),
          h("div", { className: "cr-stat" }, h("b", null, (r.peeCount || 0) ? r.peeCount + " 次" : "—"), h("span", null, "尿")),
          h("div", { className: "cr-stat" }, h("b", null, (r.waterMl || 0) ? r.waterMl + "ml" : "—"), h("span", null, "水")),
          h("div", { className: "cr-stat" }, h("b", null, (r.supplementDays || 0) ? r.supplementDays + " 天" : "—"), h("span", null, "补剂")),
          h("div", { className: "cr-stat" }, h("b", null, (r.daysRecorded || 0) ? r.daysRecorded + " 天" : "—"), h("span", null, "有记录"))
        )
      );
    }

    function NutritionPanel({ overview, onAll }) {
      const [kind, setKind] = useState("food");
      const [foodFilter, setFoodFilter] = useState("all");
      const food = (overview && overview.foodRows) || [];
      const visibleFood = foodFilter === "all" ? food : food.filter((r) => (r.foodType || "辅食") === foodFilter);
      const milkRows = (overview && overview.milkRows) || [];
      const cmp = (overview && overview.nutritionCompare && overview.nutritionCompare.ok) ? overview.nutritionCompare : null;
      const metrics = cmp ? [
        { key: "kcal", label: "能量", unit: "kcal", ref: cmp.ref.kcal },
        { key: "protein", label: "蛋白质", unit: "g", ref: cmp.ref.protein },
        { key: "iron", label: "铁", unit: "mg", ref: cmp.ref.iron },
        { key: "calcium", label: "钙", unit: "mg", ref: cmp.ref.calcium },
        { key: "zinc", label: "锌", unit: "mg", ref: cmp.ref.zinc },
      ].filter((x) => Number.isFinite(Number(x.ref))) : [];
      return h("div", { className: "cr-card", id: "cr-nutrition" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "餐食 / 奶记录 · 按记录",
          h("div", { className: "cr-metrics" }, onAll ? h("button", { className: "cr-btn ghost", onClick: () => onAll("nutrition") }, "全部") : null,
            h("button", { className: "cr-pill " + (kind === "food" ? "on" : ""), onClick: () => setKind("food") }, "餐食"),
            h("button", { className: "cr-pill " + (kind === "milk" ? "on" : ""), onClick: () => setKind("milk") }, "奶记录")
          )
        ),
        kind === "food" ? h("div", { className: "cr-mode", style: { margin: "0 0 7px" } },
          ["all", "辅食", "零食", "饮料", "水果"].map((ft) => h("button", { key: ft, className: "cr-pill " + (foodFilter === ft ? "on" : ""), onClick: () => setFoodFilter(ft) }, ft === "all" ? "全部餐食" : (ft === "辅食" ? "餐食" : ft)))
        ) : null,
        kind === "food"
          ? (visibleFood.length ? h("div", { className: "cr-table-wrap" },
            h("table", { className: "cr-table" },
              h("thead", null, h("tr", null, ["日期", "类型", "食物", "份量", "营养估算"].map((x) => h("th", { key: x }, x)))),
              h("tbody", null, visibleFood.slice(0, 8).map((r, i) => h("tr", { key: i },
                h("td", null, r.date), h("td", null, foodTypeLabel(r.foodType)), h("td", null, r.food || "—"),
                h("td", { className: r.quantity ? "" : "dim" }, r.quantity || r.ingredients || "—"),
                h("td", { className: r.nutrition ? "" : "dim" }, r.nutrition || "—")
              )))
            )
          ) : h("div", { className: "cr-empty" }, foodFilter === "all" ? "还没有餐食记录。" : "还没有" + foodFilter + "记录。"))
          : (milkRows.length ? h("div", { className: "cr-table-wrap" },
            h("table", { className: "cr-table" },
              h("thead", null, h("tr", null, ["日期", "品种", "品牌/段数", "量", "标签/估算"].map((x) => h("th", { key: x }, x)))),
              h("tbody", null, milkRows.slice(0, 8).map((r, i) => h("tr", { key: i },
                h("td", null, r.date), h("td", null, r.type || "—"), h("td", { className: r.brand ? "" : "dim" }, r.brand || "—"),
                h("td", { className: "num" }, r.amount ? Math.round(r.amount) + "ml" : "—"),
                h("td", { className: (r.label || r.estimate) ? "" : "dim" }, r.label || r.estimate || "—")
              )))
            )
          ) : h("div", { className: "cr-empty" }, "还没有奶记录。")),
        cmp ? h("div", { className: "cr-nutri" },
          h("div", { className: "cr-sec" }, "营养对照 · 按天平均", h("span", { className: "cr-mut" }, cmp.ref.label + " · 近 7 天有记录 " + cmp.days + " 天")),
          cmp.estimatedRows ? h("div", { className: "cr-mut", style: { lineHeight: 1.6, margin: "2px 0 6px" } }, "其中 " + cmp.estimatedRows + " 条按常见儿童份量粗估，不是精确摄入；有营养标签/克数时以标签为准。") : null,
          cmp.missing ? h("div", { className: "cr-mut", style: { lineHeight: 1.6, margin: "2px 0 6px" } }, "有 " + cmp.missing + " 条记录缺份量/营养标签，暂未计入；补上份量或营养估算后自动重算。") : null,
          metrics.length ? metrics.map((m) => h("div", { className: "cr-nutri-row", key: m.key },
            h("div", { className: "cr-nutri-label" }, m.label, h("span", null, "参考 " + m.ref + " " + m.unit + " / 天")),
            h("div", { className: "cr-nutri-bar" }, h("i", { style: { width: Math.min(100, (Number(cmp.avg[m.key]) || 0) / Number(m.ref) * 100) + "%" } })),
            h("div", { className: "cr-nutri-val" }, Math.round(Number(cmp.avg[m.key]) || 0) + " " + m.unit)
          )) : h("div", { className: "cr-mut" }, "没有可对照的参考"),
          (() => {
            const low = [], high = [], ok = [];
            for (const m of metrics) {
              const v = Number(cmp.avg[m.key]) || 0;
              if (v < Number(m.ref) * 0.8) low.push(m.label);
              else if (v > Number(m.ref) * 1.2) high.push(m.label);
              else ok.push(m.label);
            }
            const text = cmp.days
              ? "参考结论：参考值是同龄孩子每天的大致需要量，不是及格线。按有记录的 " + cmp.days + " 天平均，" +
                (low.length ? low.join("、") + " 低于参考；" : "") +
                (ok.length ? ok.join("、") + " 大致在参考范围；" : "") +
                (high.length ? high.join("、") + " 高于参考；" : "") +
                (low.length ? "低不等于缺营养，先看是不是这两天没记全；不要自己加补剂，必要时问儿保。" : high.length ? "高不是越多越好，按医生或说明书看。" : "通常不用紧张；记录不全时不下结论。") +
                "估算和缺记会影响结果，只作记录提示，不是营养诊断。"
              : "参考结论：最近 7 天没有足够记录，先补齐再对照；没记全不代表吃得不够。";
            return h("div", { className: "cr-ref-note" }, text);
          })(),
          h("div", { className: "cr-mut", style: { marginTop: "6px", lineHeight: 1.5 } }, cmp.note + " " + (cmp.source ? "来源：" + cmp.source.title + "。" : ""))
        ) : null
      );
    }

    function TodayPlanCard({ overview, onRemind }) {
      const today = todayISO();
      const active = (r) => (!r.start || r.start <= today) && (!r.end || r.end >= today);
      const items = [];
      for (const r of (overview && overview.specialSupplementRows) || []) if (active(r)) items.push({ kind: "补剂", name: r.name, dose: r.dose, time: r.time });
      for (const r of (overview && overview.medicationRows) || []) if (active(r)) items.push({ kind: "用药", name: r.name, dose: r.dose, time: r.time });
      const supp = overview && overview.recordRows && overview.recordRows.find((r) => r.date === today);
      if (supp && supp.supplement) items.push({ kind: "今日补剂", name: supp.supplement, dose: "", time: "" });
      if (!items.length) return null;
      return h("div", { className: "cr-card" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "今天要吃的 / 用的", h("span", { className: "cr-mut" }, "按既定方案")),
        items.map((x, i) => h("div", { key: i, className: "cr-todo-item" },
          h("div", { className: "cr-todo-dot" }),
          h("div", { style: { minWidth: 0 } },
            h("div", { className: "cr-todo-text" }, x.name + (x.dose ? " · " + x.dose : "")),
            h("div", { className: "cr-recent-date" }, x.kind + (x.time ? " · " + x.time : "")),
            x.time && onRemind ? h("button", { className: "cr-btn ghost", style: { marginTop: "3px" }, onClick: () => onRemind(x) }, "设提醒") : null
          )
        ))
      );
    }

    function VaccinePanel({ overview, onForm, onAll }) {
      const rows = (overview && overview.vaccineRows) || [];
      const plan = (overview && overview.vaccinePlanRows) || [];
      const cmp = (overview && overview.vaccineCompare) || null;
      const country = (overview && overview.country) || "中国";
      const isCN = /中国|china|cn/i.test(String(country));
      const official = isCN ? ((cmp && cmp.official) || []) : [];
      const extras = (cmp && cmp.extras) || [];
      const summary = (cmp && cmp.summary) || { total: official.length, done: 0, due: 0, alt: 0, future: 0, extras: extras.length };
      const localSummary = isCN ? summary : { total: 0, done: 0, due: 0, alt: 0, future: 0, extras: extras.length };
      const statusText = (x) => x.status === "done" ? "已记录 " + (x.date || "")
        : x.status === "alt" ? "替代：" + (x.plan || "按计划") + (x.planDose ? " 第" + x.planDose + "针" : "")
          : x.status === "due" ? "档案未记录" : "未到月龄";
      return h("div", { className: "cr-card", id: "cr-vaccine" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "疫苗对照 · 按针次",
          h("div", { className: "cr-metrics" },
            h("button", { className: "cr-btn ghost", onClick: () => onForm("vaccine") }, "记一笔"),
            h("button", { className: "cr-btn ghost", onClick: () => onForm("vaccinePlan") }, "自费/替代"),
            onAll ? h("button", { className: "cr-btn ghost", onClick: () => onAll("vaccine") }, "全部") : null)),
        !isCN ? h("div", { className: "cr-mut", style: { lineHeight: 1.6, margin: "4px 0" } }, "当前地区：" + country + "。内置疫苗程序只适用于中国；请通过对话检索当地卫生部门/儿科协会的官方程序，并注明来源和年份。生长参考仍使用 WHO 国际标准。") : null,
        isCN ? h("div", { className: "cr-statline" },
          h("div", { className: "cr-stat" }, h("b", null, summary.done + "/" + summary.total), h("span", null, "官方程序已记录")),
          h("div", { className: "cr-stat" }, h("b", null, summary.due), h("span", null, "档案未记录")),
          h("div", { className: "cr-stat" }, h("b", null, summary.alt), h("span", null, "替代计划")),
          h("div", { className: "cr-stat" }, h("b", null, summary.extras), h("span", null, "自费/其他记录"))
        ) : null,
        official.length ? h("div", { className: "cr-vax-timeline" },
          h("div", { className: "cr-sec", style: { marginTop: "8px" } }, "按官方月龄 · 完成情况", h("span", { className: "cr-mut" }, "每行一组针次")),
          (() => {
            const groups = [];
            const map = new Map();
            for (const r of official) {
              const age = r.age || "其他";
              if (!map.has(age)) { map.set(age, { age, done: 0, alt: 0, due: 0, future: 0, total: 0, statuses: [] }); groups.push(map.get(age)); }
              const g = map.get(age); g.total += 1; g.statuses.push(r.status);
              if (r.status === "done") g.done += 1; else if (r.status === "alt") g.alt += 1; else if (r.status === "due") g.due += 1; else g.future += 1;
            }
            return h("div", { className: "cr-vax-grid" }, groups.map((g) => {
              const complete = g.done + g.alt >= g.total;
              return h("div", { className: "cr-vax-tile" + (complete ? " done" : ""), key: g.age },
                h("div", { className: "cr-vax-tile-top" }, h("b", null, g.done + "/" + g.total), h("span", null, g.age)),
                h("div", { className: "cr-vax-dots" }, g.statuses.map((st, i) => h("i", {
                  key: i, className: "cr-vax-dot " + (st === "done" ? "done" : st === "alt" ? "alt" : st === "due" ? "due" : "future"),
                })))
              );
            }));
          })(),
          h("div", { className: "cr-legend", style: { marginTop: "4px" } },
            h("span", null, h("i", { style: { background: "rgba(210,75,54,.72)" } }), "已记录"),
            h("span", null, h("i", { style: { background: "rgba(210,75,54,.52)" } }), "替代"),
            h("span", null, h("i", { style: { background: "rgba(210,75,54,.30)" } }), "未记录"),
            h("span", null, h("i", { style: { background: "#FAFAFA" } }), "未到月龄")
          )
        ) : null,
        official.length ? h("div", { className: "cr-table-wrap", style: { marginTop: "8px", maxHeight: "300px", overflow: "auto" } },
          h("table", { className: "cr-table" },
            h("thead", null, h("tr", null, ["疫苗", "针次", "官方月龄", "状态"].map((x) => h("th", { key: x, className: x === "针次" || x === "官方月龄" ? "num" : "" }, x)))),
            h("tbody", null, official.map((r, i) => h("tr", { key: i },
              h("td", null, r.vaccine),
              h("td", { className: "num" }, "第" + r.dose + "针"),
              h("td", { className: "num" }, r.age),
              h("td", null, h("span", { className: "cr-vax " + r.status }, statusText(r)))
            )))
          )
        ) : h("div", { className: "cr-empty" }, "还没有官方对照数据。"),
        (cmp && cmp.selfPaid && cmp.selfPaid.length) ? h("div", { style: { marginTop: "10px" } },
          h("div", { className: "cr-sec", style: { marginTop: 0 } }, "自费疫苗清单", h("span", { className: "cr-mut" }, "可替代关系只做对照，最终以接种门诊为准")),
          h("div", { className: "cr-table-wrap" },
            h("table", { className: "cr-table" },
              h("thead", null, h("tr", null, ["自费疫苗", "可替代的官方针次", "已记录", "说明"].map((x) => h("th", { key: x }, x)))),
              h("tbody", null, cmp.selfPaid.map((v, i) => h("tr", { key: i },
                h("td", null, v.name),
                h("td", { className: v.covers.length ? "" : "dim" }, v.covers.length ? v.covers.filter((c) => !c.hidden).map((c) => c.label || (c.key + " " + c.doses + " 针")).join("、") : "不替代官方针次"),
                h("td", { className: "num" }, v.doses ? v.doses + " 针" + (v.dates.length ? "（" + v.dates.slice(-1)[0] + "）" : "") : "未记录"),
                h("td", { className: "dim" }, v.note)
              )))
            )
          )
        ) : null,
        extras.length ? h("div", { style: { marginTop: "10px" } },
          h("div", { className: "cr-sec", style: { marginTop: 0 } }, "自费 / 其他记录"),
          h("div", { className: "cr-table-wrap" },
            h("table", { className: "cr-table" },
              h("thead", null, h("tr", null, ["日期", "疫苗", "针次", "月龄"].map((x) => h("th", { key: x }, x)))),
              h("tbody", null, extras.map((r, i) => h("tr", { key: i },
                h("td", null, r.date || "—"), h("td", null, r.name || "—"),
                h("td", { className: "num" }, r.dose ? "第" + r.dose + "针" : "—"),
                h("td", { className: "num" }, r.months || "—")
              )))
            )
          )
        ) : null,
        plan.length ? h("div", { style: { marginTop: "10px" } },
          h("div", { className: "cr-sec", style: { marginTop: 0 } }, "自费/替代计划", h("span", { className: "cr-mut" }, "只按家长/门诊记录")),
          h("div", { className: "cr-table-wrap" },
            h("table", { className: "cr-table" },
              h("thead", null, h("tr", null, ["官方", "实际", "说明"].map((x) => h("th", { key: x }, x)))),
              h("tbody", null, plan.map((r, i) => h("tr", { key: i },
                h("td", null, (r.official || "—") + (r.officialDose ? " 第" + r.officialDose + "针" : "")),
                h("td", null, (r.actual || "—") + (r.actualDose ? " 第" + r.actualDose + "针" : "")),
                h("td", { className: "dim" }, r.note || "—")
              )))
            )
          )
        ) : null,
        rows.length ? h("div", { className: "cr-mut", style: { marginTop: "8px" } }, "已记录 " + rows.length + " 针；官方程序只做对照，不代表接种建议。") : null,
        isCN && overview && overview.vaccineSource ? h("div", { className: "cr-mut", style: { marginTop: "6px" } }, "来源：" + overview.vaccineSource.title + "；以当地接种门诊为准。") : null
      );
    }

    function CheckupPanel({ overview, onForm, onAll }) {
      const rows = (overview && overview.checkupRows) || [];
      return h("div", { className: "cr-card", id: "cr-checkup" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "体检汇总 · 按次", h("div", { className: "cr-metrics" }, h("button", { className: "cr-btn ghost", onClick: () => onForm("checkup") }, "记一次"), onAll ? h("button", { className: "cr-btn ghost", onClick: () => onAll("checkup") }, "全部") : null)),
        rows.length ? h("div", { className: "cr-table-wrap" },
          h("table", { className: "cr-table" },
            h("thead", null, h("tr", null, ["日期", "月龄", "项目", "结果", "医生建议"].map((x) => h("th", { key: x, className: x === "月龄" ? "num" : "" }, x)))),
            h("tbody", null, rows.map((r, i) => h("tr", { key: i },
              h("td", null, r.date), h("td", { className: "num" }, r.months || "—"), h("td", null, r.item || "—"),
              h("td", { className: r.result ? "" : "dim" }, r.result || "—"), h("td", { className: r.advice ? "" : "dim" }, r.advice || "—")
            )))
          )
        ) : h("div", { className: "cr-empty" }, "还没有体检记录。只记录，不解读。")
      );
    }

    function MilestonePanel({ overview, onForm, onAll }) {
      const rows = (overview && overview.milestoneRows) || [];
      const [mode, setMode] = useState("timeline");
      return h("div", { className: "cr-card", id: "cr-milestone" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "里程碑 · 第一次 / 阶段突破", h("div", { className: "cr-metrics" },
          h("button", { className: "cr-pill " + (mode === "timeline" ? "on" : ""), onClick: () => setMode("timeline") }, "时间线"),
          h("button", { className: "cr-pill " + (mode === "table" ? "on" : ""), onClick: () => setMode("table") }, "表格"),
          h("button", { className: "cr-btn ghost", onClick: () => onForm("milestone") }, "记一条"),
          onAll ? h("button", { className: "cr-btn ghost", onClick: () => onAll("milestone") }, "全部") : null)),
        rows.length ? (mode === "table" ? h("div", { className: "cr-table-wrap" },
          h("table", { className: "cr-table" },
            h("thead", null, h("tr", null, ["日期", "月龄", "事件", "出处"].map((x) => h("th", { key: x, className: x === "月龄" ? "num" : "" }, x)))),
            h("tbody", null, rows.map((r, i) => h("tr", { key: i }, h("td", null, r.dateLabel || r.date || "—"), h("td", { className: "num" }, r.months || "—"), h("td", null, r.text), h("td", { className: r.source ? "" : "dim" }, r.source || "—"))))
          )
        ) : h("div", { className: "cr-timeline" }, rows.slice(0, 6).map((r, i) => h("div", { className: "cr-timeline-row", key: i },
          h("div", { className: "cr-timeline-date" }, r.dateLabel || r.date || "—"),
          h("div", { className: "cr-timeline-dot" }),
          h("div", { className: "cr-timeline-body" }, h("b", null, r.text), h("span", null, (r.months ? r.months + " 月龄" : "") + (r.source ? " · " + r.source : "")))
        )))) : h("div", { className: "cr-empty" }, "还没有里程碑记录。")
      );
    }

    function SpecialSupplementPanel({ overview, onForm, onAll }) {
      const rows = (overview && overview.specialSupplementRows) || [];
      return h("div", { className: "cr-card", id: "cr-special-supplement" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "特殊补剂 · 按次", h("div", { className: "cr-metrics" }, h("button", { className: "cr-btn ghost", onClick: () => onForm("specialSupplement") }, "加一条"), onAll ? h("button", { className: "cr-btn ghost", onClick: () => onAll("specialSupplement") }, "全部") : null)),
        rows.length ? h("div", { className: "cr-table-wrap" },
          h("table", { className: "cr-table" },
            h("thead", null, h("tr", null, ["名称", "产品", "剂量", "频率", "时间", "开始", "停用", "依据"].map((x) => h("th", { key: x }, x)))),
            h("tbody", null, rows.map((r, i) => h("tr", { key: i },
              h("td", null, r.name || "—"), h("td", { className: r.product ? "" : "dim" }, r.product || "—"),
              h("td", null, r.dose || "—"), h("td", null, r.frequency || "—"), h("td", null, r.time || "—"),
              h("td", null, r.start || "—"), h("td", null, r.end || "—"), h("td", { className: r.source ? "" : "dim" }, r.source || "—")
            )))
          )
        ) : h("div", { className: "cr-empty" }, "还没有特殊补剂。剂量按医嘱/说明书填。")
      );
    }

    function MedicationPanel({ overview, onForm, onAll }) {
      const rows = (overview && overview.medicationRows) || [];
      return h("div", { className: "cr-card", id: "cr-medication" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "用药 · 按次", h("div", { className: "cr-metrics" }, h("button", { className: "cr-btn ghost", onClick: () => onForm("medication") }, "加一条"), onAll ? h("button", { className: "cr-btn ghost", onClick: () => onAll("medication") }, "全部") : null)),
        rows.length ? h("div", { className: "cr-table-wrap" },
          h("table", { className: "cr-table" },
            h("thead", null, h("tr", null, ["药名", "剂量", "频率", "时间", "开始", "结束", "医嘱/原因", "备注"].map((x) => h("th", { key: x }, x)))),
            h("tbody", null, rows.map((r, i) => h("tr", { key: i },
              h("td", null, r.name || "—"), h("td", null, r.dose || "—"), h("td", null, r.frequency || "—"),
              h("td", null, r.time || "—"), h("td", null, r.start || "—"), h("td", null, r.end || "—"),
              h("td", { className: r.reason ? "" : "dim" }, r.reason || "—"), h("td", { className: r.note ? "" : "dim" }, r.note || "—")
            )))
          )
        ) : h("div", { className: "cr-empty" }, "暂无用药记录。仅记录医嘱或家长填报内容，不提供用药建议。")
      );
    }

    function CombinedPanel({ overview }) {
      const items = [];
      const push = (date, type, text) => { if (date) items.push({ date, type, text }); };
      for (const r of (overview && overview.recordRows) || []) {
        const parts = [r.milk, r.poop, r.pee, r.water, r.food, r.supplement].filter(Boolean);
        if (parts.length) push(r.date, "日常", parts.join(" / "));
      }
      for (const m of (overview && overview.milestoneRows) || []) push(m.date, "里程碑", m.text);
      for (const v of (overview && overview.vaccineRows) || []) push(v.date, "疫苗", v.name + (v.dose ? " · " + v.dose + " 剂" : ""));
      for (const c of (overview && overview.checkupRows) || []) push(c.date, "体检", c.item + (c.result ? " · " + c.result : ""));
      for (const g of (overview && overview.growthRows) || []) {
        const parts = []; if (g.height) parts.push(g.height + " cm"); if (g.weight) parts.push(g.weight + " kg");
        if (parts.length) push(g.date, "生长", parts.join(" / "));
      }
      const list = items.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 60);
      return h("div", { className: "cr-card" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "总汇总", h("span", { className: "cr-mut" }, "按时间倒序")),
        list.length ? h("div", { className: "cr-table-wrap" },
          h("table", { className: "cr-table" },
            h("thead", null, h("tr", null, ["日期", "类型", "内容"].map((x) => h("th", { key: x }, x)))),
            h("tbody", null, list.map((r, i) => h("tr", { key: i },
              h("td", null, r.date), h("td", null, r.type), h("td", null, r.text)
            )))
          )
        ) : h("div", { className: "cr-empty" }, "还没有带日期的记录。")
      );
    }

    // ── 表：发育评估 ──
    function PersonalityPanel({ overview, onAll }) {
      const rows = (overview && overview.personality) || [];
      return h("div", { className: "cr-card", id: "cr-personality" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "人格与偏好 · 按观察", h("div", { className: "cr-metrics" }, h("span", { className: "cr-mut" }, "聊天里逐步补"), onAll ? h("button", { className: "cr-btn ghost", onClick: () => onAll("personality") }, "全部") : null)),
        rows.length ? h("div", { className: "cr-table-wrap" },
          h("table", { className: "cr-table" },
            h("thead", null, h("tr", null, ["维度", "观察", "场景", "置信度"].map((x) => h("th", { key: x }, x)))),
            h("tbody", null, rows.slice().reverse().slice(0, 8).map((r, i) => h("tr", { key: i },
              h("td", null, h("span", { className: "cr-chip" }, r.dimension || "—")),
              h("td", null, r.observation || "—"),
              h("td", { className: "dim" }, r.context || "—"),
              h("td", { className: "dim" }, (r.confidence || "中"))
            )))
          )
        ) : h("div", { className: "cr-empty" }, "还没有记录。聊天里提到孩子的偏好、安抚方式、怕什么，会归到这里。"),
        h("div", { className: "cr-mut", style: { marginTop: "6px" } }, "只写观察到的事，不贴标签；会变，隔一阵回看。")
      );
    }

    function AssessmentPanel({ overview, onSave, onForm, onAll }) {
      const a = overview && overview.assess;
      const history = (overview && overview.assessHistory) || [];
      const hospital = (overview && overview.hospitalAssess) || [];
      const checkpoints = (a && a.checkpoints && a.checkpoints.length) ? a.checkpoints : (a ? [{ key: a.checkpoint, role: "current", items: a.items || [] }] : []);
      const [activeKey, setActiveKey] = useState(a && a.checkpoint);
      const selected = checkpoints.find((x) => x.key === activeKey) || checkpoints[0];
      const [answers, setAnswers] = useState({});
      const [busy, setBusy] = useState(false);
      const [msg, setMsg] = useState("");
      const [dirty, setDirty] = useState(false);
      const [savedLocal, setSavedLocal] = useState(false);
      useEffect(() => {
        if (selected && !checkpoints.some((x) => x.key === activeKey)) setActiveKey(selected.key);
      }, [a && a.checkpoint]);
      useEffect(() => {
        if (!selected) return;
        const last = history.slice().reverse().find((r) => String(r.scale || "").includes(String(selected.key)));
        const next = {};
        if (last && last.result && last.result.includes("｜")) {
          const detail = last.result.split("｜")[1] || "";
          for (const part of detail.split(/[；;]/)) {
            const m = /^\s*(\d+)\s*=\s*(是|有时|否)\s*$/.exec(part);
            if (m) next[Number(m[1]) - 1] = m[2] === "是" ? "yes" : m[2] === "有时" ? "sometimes" : "no";
          }
        }
        setAnswers(next);
        setMsg("");
        setDirty(false);
        setSavedLocal(false);
      }, [selected && selected.key, history.length]);
      if (!a) return h("div", { className: "cr-card" }, h("div", { className: "cr-empty" }, "还没有评估数据。"));
      const items = selected ? selected.items || [] : [];
      const advanced = !!(selected && a.checkpoint && selected.key > a.checkpoint);
      const lookingBack = !!(selected && a.checkpoint && selected.key < a.checkpoint);
      const answered = items.filter((_, i) => answers[i]).length;
      const notYet = items.filter((_, i) => answers[i] === "no" || answers[i] === "sometimes").length;
      const lastForSelected = selected ? history.slice().reverse().find((r) => String(r.scale || "").includes(String(selected.key))) : null;
      const isSaved = !!((lastForSelected || savedLocal) && !dirty);
      const choice = (i, v) => { setAnswers((x) => ({ ...x, [i]: v })); setDirty(true); setSavedLocal(false); };
      const roleLabel = (r) => r === "previous" ? "前一个" : r === "next" ? "后一个" : "当前";
      async function save() {
        if (answered < items.length) { setMsg("还有 " + (items.length - answered) + " 项没选"); return; }
        const labels = { yes: "是", sometimes: "有时", no: "否" };
        const counts = { yes: 0, sometimes: 0, no: 0 };
        const detail = items.map((_, i) => { const v = answers[i]; counts[v] += 1; return (i + 1) + "=" + labels[v]; }).join("；");
        const result = (advanced ? "超前预览｜" : lookingBack ? "回看前一阶段｜" : "") + "是 " + counts.yes + " / 有时 " + counts.sometimes + " / 否 " + counts.no + "｜" + detail;
        const next = advanced
          ? (counts.no || counts.sometimes ? "超前预览，但有未确定项：继续往前看，具体问儿保" : "超前预览：关注下一阶段，不要求提前训练")
          : lookingBack && (counts.no || counts.sometimes) ? "回看前一阶段：先补支持，不贴落后标签，具体问儿保"
            : counts.no >= 2 ? "有几项没达成：先补当前阶段支持，必要时问儿保；不催、不比较"
              : counts.no || counts.sometimes ? "有未确定项，建议儿保问一句" : "继续观察";
        setBusy(true);
        const r = onSave ? await onSave({ date: todayISO(), months: selected.key, scale: selected.key + " 月龄自评", result, next }).catch((e) => ({ ok: false, error: String(e && e.message ? e.message : e) })) : { ok: false, error: "没有写入入口" };
        setBusy(false);
        if (r && r.ok) { setDirty(false); setSavedLocal(true); }
        setMsg(r && r.ok ? (advanced ? "已记下；这是超前预览，建议往前看下一阶段，不用提前训练" : lookingBack && (counts.no || counts.sometimes) ? "已记下；先回看前一阶段补支持，不贴落后标签" : "已记下这次自评") : ((r && r.error) || "保存失败"));
      }
      return h("div", null,
        h("div", { className: "cr-card", id: "cr-assessment" },
          h("div", { className: "cr-sec", style: { marginTop: 0 } }, "发育评估",
            h("div", { className: "cr-metrics" },
              h("button", { className: "cr-btn ghost", onClick: () => onForm && onForm("hospitalAssessment") }, "医院评估"),
              h("span", { className: "cr-mut" }, "已答 " + answered + "/" + items.length),
              onAll ? h("button", { className: "cr-btn ghost", onClick: () => onAll("assessment") }, "全部") : null)),
          checkpoints.length ? h("div", { className: "cr-mode", style: { flexWrap: "wrap" } }, checkpoints.map((x) => h("button", {
            key: x.key, className: "cr-pill " + (selected && selected.key === x.key ? "on" : ""), onClick: () => setActiveKey(x.key),
          }, roleLabel(x.role) + " " + x.key + " 月龄"))) : null,
          selected ? h("div", { className: "cr-mut", style: { marginBottom: "4px" } }, "前一个/后一个都列出来；每个孩子有早有晚，不按单次打分。") : null,
          advanced ? h("div", { className: "cr-stage-note" }, h("b", null, "超前预览"), h("span", null, "这是后一个阶段。如果多数是「是」，可以往前看下一阶段，不要求提前训练或加码。")) : null,
          lookingBack ? h("div", { className: "cr-stage-note" }, h("b", null, "回看前一阶段"), h("span", null, "每个孩子节奏不同；有没达成的，把支持放回前一阶段，不贴「落后」标签，必要时问儿保。")) : null,
          (!advanced && !lookingBack && notYet >= 2) ? h("div", { className: "cr-stage-note" }, h("b", null, "有 " + notYet + " 项还没达成"), h("span", null, "先补当前阶段的支持，必要时问儿保；不催、不比较，不贴标签。")) : null,
          h("div", { className: "cr-mut", style: { marginBottom: "4px", lineHeight: 1.6 } },
            lastForSelected || savedLocal ? ("上次保存：" + ((lastForSelected && lastForSelected.date) || "刚刚") + ((lastForSelected && lastForSelected.result) ? " · " + String(lastForSelected.result).split("｜")[0] : "")) : "这次自评还没有保存过。"),
          h("div", { className: "cr-table-wrap" },
            h("table", { className: "cr-table" },
              h("thead", null, h("tr", null, h("th", null, "#"), h("th", null, "条目"), h("th", null, "现在"))),
              h("tbody", null, items.map((item, i) => h("tr", { key: i },
                h("td", { className: "num" }, i + 1),
                h("td", null, item),
                h("td", null, h("div", { className: "cr-choice" },
                  [["yes", "是"], ["sometimes", "有时"], ["no", "否"]].map(([k, label]) =>
                    h("button", { key: k, className: "cr-pill " + (answers[i] === k ? "on" : ""), onClick: () => choice(i, k) }, label))
                ))
              )))
            )
          ),
          h("button", { className: "cr-btn primary", style: { marginTop: "8px" }, disabled: busy || isSaved || answered < items.length, onClick: save },
            busy ? "保存中…" : isSaved ? "已保存 · 无需重复提交" : answered < items.length ? "还有 " + (items.length - answered) + " 项没选" : lastForSelected ? "重新保存这次自评" : "保存这次自评"),
          msg ? h("div", { className: "cr-mut", style: { marginTop: "6px" } }, msg) : null,
          h("div", { className: "cr-mut", style: { marginTop: "8px" } }, "筛查不是诊断，不打分；有阳性去儿保问一句，不自己下结论。")
        ),
        h("div", { className: "cr-card" },
          h("div", { className: "cr-sec", style: { marginTop: 0 } }, "医院发育评估", h("button", { className: "cr-btn ghost", onClick: () => onForm && onForm("hospitalAssessment") }, "记一次")),
          hospital.length ? h("div", { className: "cr-table-wrap" },
            h("table", { className: "cr-table" },
              h("thead", null, h("tr", null, ["日期", "月龄", "机构", "项目", "结果", "医生建议"].map((x) => h("th", { key: x, className: x === "月龄" ? "num" : "" }, x)))),
              h("tbody", null, hospital.slice().reverse().map((r, i) => h("tr", { key: i },
                h("td", null, r.date || "—"), h("td", { className: "num" }, r.months || "—"),
                h("td", null, r.institution || "—"), h("td", null, r.tool || "—"),
                h("td", null, r.result || "—"), h("td", { className: "dim" }, r.advice || "—")
              )))
            )
          ) : h("div", { className: "cr-empty" }, "医院/儿保做的评估可以记在这里，作为自评的补充；结论以医生为准。")
        ),
        history.length ? h("div", { className: "cr-card" },
          h("div", { className: "cr-sec", style: { marginTop: 0 } }, "自评记录"),
          h("div", { className: "cr-table-wrap" },
            h("table", { className: "cr-table" },
              h("thead", null, h("tr", null, ["日期", "量表", "结果", "下一步"].map((x) => h("th", { key: x }, x)))),
              h("tbody", null, history.slice().reverse().slice(0, 8).map((r, i) => h("tr", { key: i },
                h("td", null, r.date || "—"), h("td", null, r.scale || "—"),
                h("td", null, (r.result || "—").split("｜")[0]), h("td", { className: "dim" }, r.next || "—")
              )))
            )
          )
        ) : null
      );
    }

    function FormModal({ type, onClose, onSubmit, busy, devMode }) {
      const def = FORMS[type] || FORMS.record;
      const [values, setValues] = useState(() => {
        const v = {}; for (const f of def.fields) v[f.key] = f.default !== undefined ? f.default : ""; return v;
      });
      return h("div", { className: "cr-overlay", onClick: onClose },
        h("div", { className: "cr-sheet", onClick: (e) => e.stopPropagation() },
          h("h3", null, def.title, h("span", { className: "cr-mut", style: { marginLeft: "8px" } }, "表单填写")),
          def.note ? h("div", { className: "cr-mut", style: { marginBottom: "10px", lineHeight: 1.5 } }, def.note) : null,
          def.fields.map((f) => h("div", { key: f.key, className: "cr-field" },
            h("label", null, f.label),
            f.type === "select"
              ? h("select", { value: values[f.key], onChange: (e) => setValues({ ...values, [f.key]: e.target.value }) },
                f.options.map(([k, label]) => h("option", { key: k, value: k }, label)))
              : f.type === "textarea"
                ? h("textarea", { value: values[f.key], placeholder: f.placeholder || "", onChange: (e) => setValues({ ...values, [f.key]: e.target.value }) })
                : h("input", { type: f.type || "text", value: values[f.key], placeholder: f.placeholder || "", max: f.type === "date" && !devMode ? todayISO() : undefined, onChange: (e) => setValues({ ...values, [f.key]: e.target.value }) })
          )),
          h("button", { className: "cr-btn primary", disabled: busy, onClick: () => onSubmit(values), style: { width: "100%", padding: "10px" } }, busy ? "保存中…" : "保存"),
          h("div", { className: "cr-mut", style: { marginTop: "8px", textAlign: "center" } }, devMode ? "开发测试模式：日期可填未来。" : "正常模式：日期不能填未来（待办除外）。")
        )
      );
    }

    function iconTomato(color) {
      return h("svg", { viewBox: "0 0 24 24", width: 22, height: 22 },
        h("circle", { cx: 12, cy: 14, r: 7, fill: color || "currentColor" }),
        h("path", { d: "M12 7c-1.5-2-3-2.5-4-2.5 0 1.5.8 2.6 2 3.2M12 7c1.5-2 3-2.5 4-2.5 0 1.5-.8 2.6-2 3.2", stroke: "#000000", strokeWidth: 1.4, fill: "none", strokeLinecap: "round" })
      );
    }

    async function fileToAvatarDataUrl(file) {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const size = 256;
            const canvas = document.createElement("canvas");
            canvas.width = size; canvas.height = size;
            const cx = canvas.getContext("2d");
            const scale = Math.max(size / img.width, size / img.height);
            const w = img.width * scale, h = img.height * scale;
            cx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          };
          img.onerror = () => reject(new Error("图片读不了"));
          img.src = reader.result;
        };
        reader.onerror = () => reject(new Error("文件读不了"));
        reader.readAsDataURL(file);
      });
      return dataUrl;
    }

    function Avatar({ child, size }) {
      const c = child || {};
      const px = size || 44;
      if (c.avatar) {
        return h("div", { className: "cr-av", style: { width: px + "px", height: px + "px", padding: 0, overflow: "hidden" } },
          h("img", { src: "/api/dsh-tomatronic-child-raise/avatar?child=" + encodeURIComponent(c.id || ""), alt: "", style: { width: "100%", height: "100%", objectFit: "cover" } })
        );
      }
      return h("div", { className: "cr-av", style: { width: px + "px", height: px + "px", color: c.avatarColor || "#D24B36" } }, iconTomato(c.avatarColor || "#D24B36"));
    }

    function SidebarIcon(props) {
      const size = (props && props.size) || 18;
      return h("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none" },
        h("circle", { cx: 12, cy: 14, r: 7, fill: "#D24B36" }),
        h("path", { d: "M12 7c-1.5-2-3-2.5-4-2.5 0 1.5.8 2.6 2 3.2M12 7c1.5-2 3-2.5 4-2.5 0 1.5-.8 2.6-2 3.2", stroke: "#000000", strokeWidth: 1.4, fill: "none", strokeLinecap: "round" })
      );
    }

    const MIGRATION_PROMPT = "我已有孩子/孕期的旧数据，想迁移进问问。请先确认孩子档案，再让我逐段粘贴文字或上传纸质照片/PDF；先预览你读到的内容，确认后再写，只写有出处的内容，来源标「迁移导入」，缺的日期标待补，不猜。";
    let childActions = { open: null, launch: null, isChild: null, onboardChat: null, sessions: new Set(), activeId: "", onboardingDismissed: false, forceOnboard: false };
    const sessionChildKey = (sid) => "cr-session-child:" + String(sid || "");
    const readSessionChild = (sid) => {
      try { return sid ? (localStorage.getItem(sessionChildKey(sid)) || "") : ""; } catch { return ""; }
    };
    const bindSessionChild = (sid, id) => {
      if (!sid || !id) return;
      try { localStorage.setItem(sessionChildKey(sid), String(id)); } catch { /* ignore */ }
    };
    const notifyActiveChild = (id) => {
      if (!id) return;
      childActions.activeId = id;
      try { window.dispatchEvent(new CustomEvent("cr-child-active", { detail: { id } })); } catch { /* ignore */ }
    };
    let widenPanel = null;

    function widenRightPanel(px) {
      try {
        if (typeof window === "undefined" || !widenPanel) return;
        if (px) { widenPanel(px); return; }
        if (sessionStorage.getItem("cr-panel-width-v3") === "1") return;
        sessionStorage.setItem("cr-panel-width-v3", "1");
        // 侧栏保持紧凑：420px（DSH 最小 300）。
        widenPanel(420);
      } catch { /* best effort */ }
    }

    function Launcher() {
      useLocaleVersion();
      const [status, setStatus] = useState(null);
      const [creating, setCreating] = useState(false);
      const [showProfiles, setShowProfiles] = useState(true);
      const [draftWorkspace, setDraftWorkspace] = useState("");
      const [migrateWorkspace, setMigrateWorkspace] = useState(true);
      const [msg, setMsg] = useState("");
      const load = useCallback(async () => { setStatus(await loadStatus().catch(() => null)); repairSessions().then(cleanupWorkspaces); }, []);
      useEffect(() => { load(); }, [load]);
      useEffect(() => { if (status && status.workspace) setDraftWorkspace(status.workspace); }, [status && status.workspace]);
      async function finishCreate() {
        const s = await loadStatus().catch(() => null);
        setStatus(s);
        setCreating(false);
        if (!s || !s.children || !s.children.length) return;
        const child = s.children[s.children.length - 1];
        try {
          await childActions.openOrResume(s, child.id);
          if (childActions.sendPrompt) await childActions.sendPrompt("档案已建好。请先读一遍档案和当前阶段，再用一句话告诉我下一步可以做什么。");
        } catch (e) { setMsg(String(e && e.message ? e.message : e)); }
      }
      async function chooseWorkspace() {
        try {
          const ui = pluginCtx.get("uiWorkspace");
          if (!ui || typeof ui.pickDirectory !== "function") { setMsg("当前环境不支持目录选择，直接填路径"); return; }
          const picked = await ui.pickDirectory();
          if (picked) { setDraftWorkspace(picked); setMsg("已选择，点保存生效"); }
        } catch (e) { setMsg(String(e && e.message ? e.message : e)); }
      }
      async function saveWorkspace() {
        const path = String(draftWorkspace || "").trim();
        if (!path) { setMsg("请选择工作目录"); return; }
        const r = await api("/workspace/set", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path, migrate: migrateWorkspace }) }).catch(() => null);
        if (!r || !r.ok) { setMsg((r && r.error) || "保存失败"); return; }
        setMsg(r.warning || "工作目录已保存");
        await load();
      }
      async function copyWorkspace() {
        const text = String(status && status.workspace || "");
        if (!text) return;
        try { await navigator.clipboard.writeText(text); setMsg("工作目录已复制"); }
        catch { setMsg("复制失败，可以手动选中路径"); }
      }
      async function toggle(path, enabled) {
        const r = await api(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ enabled }) }).catch(() => null);
        setMsg(r && r.ok ? "已切换" : ((r && r.error) || "切换失败"));
        await load();
      }
      if (!status) return h("div", { className: "cr-launch" }, tr("正在打开问问…"));
      if (creating) return h("div", { className: "cr-launch-page" },
        h(OnboardingCard, { status, onDone: finishCreate, onCancel: () => setCreating(false), onChat: async () => { setCreating(false); try { await childActions.goChat(status, "我想第一次用问问建档案。请先问我：孩子小名、生日或预产期、性别、国家/城市。"); } catch (e) { setMsg(String(e && e.message ? e.message : e)); } }, onMigrate: async () => { setCreating(false); try { await childActions.goChat(status, "我有以前散落在纸/微信/表格里的育儿记录，想迁移进档案。请先告诉我需要准备什么、按什么格式发给你。"); } catch (e) { setMsg(String(e && e.message ? e.message : e)); } } }),
        msg ? h("div", { className: "cr-mut", style: { marginTop: "8px" } }, msg) : null
      );
      const children = status.children || [];
      const disabled = !children.length;
      const entryButton = (key, icon, title, desc, onClick, active, off) => h("button", {
        key, className: "cr-entry-btn" + (key === "create" ? " primary" : "") + (active ? " active" : "") + (off ? " disabled" : ""), disabled: off, onClick,
      },
        h("span", { className: "cr-entry-btn-icon" }, icon),
        h("b", null, title),
        h("span", { className: "cr-entry-btn-desc" }, desc)
      );
      return h("div", { className: "cr-entry" },
        h("div", { className: "cr-entry-hero" },
          h(Avatar, { child: null, size: 58 }),
          h("h1", null, tr("问问")),
          h("p", null, tr("带档案的育儿搭档。孕期、成长、喂养、睡眠、健康和花费，都记在同一个孩子档案里。")),
          h("div", { className: "cr-entry-features" }, [tr("孕期到 3 岁"), tr("日常 / 睡眠"), tr("生长 / 疫苗"), tr("花费 / 补剂"), tr("可迁移旧数据")].map((x) => h("span", { key: x }, x)))
        ),
        h("div", { className: "cr-entry-workspace" },
          h("span", { className: "cr-entry-workspace-label" }, tr("默认工作目录")),
          h("input", { className: "cr-entry-workspace-input", value: draftWorkspace, placeholder: tr("选择目录，不改就用预设"), onChange: (e) => setDraftWorkspace(e.target.value) }),
          h("button", { className: "cr-btn ghost", onClick: () => chooseWorkspace() }, tr("选择…")),
          h("button", { className: "cr-btn", onClick: () => saveWorkspace() }, "保存")
        ),
        children.length ? h("label", { className: "cr-mut", style: { display: "flex", alignItems: "center", gap: "5px", margin: "0 0 8px", maxWidth: "860px", width: "100%" } },
          h("input", { type: "checkbox", checked: migrateWorkspace, onChange: (e) => setMigrateWorkspace(e.target.checked) }), tr("保存时把已有档案一起迁到新目录")
        ) : null,
        h("div", { className: "cr-entry-workspace-note" }, tr("插件只认一个总工作区；下面列出的是总工作区里的档案子工作区。点哪个子目录，就打开哪个档案。")),
        h("div", { className: "cr-entry-buttons" },
          entryButton("create", "＋", tr("创建新档案"), tr("孕期、0–3 岁或自由模式"), async () => {
            childActions.onboardingDismissed = false;
            childActions.forceOnboard = true;
            setOnboardDismissed(pluginWorkspace, false);
            try { window.dispatchEvent(new Event("cr-onboarding-show")); } catch { /* ignore */ }
            try { await childActions.openBlank(status); }
            catch (e) { setMsg(String(e && e.message ? e.message : e)); setCreating(true); }
          }, false, false),
          entryButton("select", "档", tr("选择档案"), disabled ? tr("还没有档案") : tr("打开并延续上次会话"), () => setShowProfiles(true), showProfiles, disabled),
          entryButton("dev", "开", tr("开发模式"), status.devMode ? tr("已开启 · 更高权限") : tr("关闭 · 点击开启"), () => toggle("/dev-mode", !status.devMode), status.devMode, false),
          entryButton("virtual", "虚", tr("虚拟模式"), tr("待开发"), null, false, true)
        ),
        showProfiles && children.length ? h("div", { className: "cr-entry-panel" },
          h("div", { className: "cr-entry-panel-title" }, tr("档案子工作区"), h("span", { className: "cr-mut" }, String(status.workspace || "").split("/").pop() + " 下 · " + children.length + " 个")),
          h("div", { className: "cr-entry-list" }, children.map((c) => h("div", {
            key: c.id, className: "cr-entry-item", role: "button", tabIndex: 0, onClick: async () => {
              try { await childActions.openOrResume(status, c.id); } catch (e) { setMsg(String(e && e.message ? e.message : e)); }
            },
          },
            h(Avatar, { child: c, size: 38 }),
            h("span", { style: { minWidth: 0, flex: 1, textAlign: "left" } },
              h("b", null, c.name),
              h("span", { className: "cr-mut" }, " · " + (c.ageText || c.ageShort || "") + (c.stage ? " · " + c.stage.label : "")),
              h("div", { className: "cr-mut", style: { fontSize: "10px", marginTop: "2px" } }, "子目录：" + String(c.workspace || "").split("/").pop())
            ),
            h("span", { className: "cr-entry-arrow" }, "→")
          )))
        ) : null,
        msg ? h("div", { className: "cr-entry-msg" }, msg) : null
      );
    }

    function ReminderPanel({ items, onDelete }) {
      if (!items || !items.length) return null;
      return h("div", { className: "cr-card" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "到点提醒", h("span", { className: "cr-mut" }, "DSH 定时任务")),
        items.map((x) => h("div", { key: x.id, className: "cr-todo-item" },
          h("div", { className: "cr-todo-dot" }),
          h("div", { style: { minWidth: 0, flex: 1 } },
            h("div", { className: "cr-todo-text" }, x.title),
            h("div", { className: "cr-recent-date" }, (x.status || "") + (x.scheduledAt ? " · " + String(x.scheduledAt).slice(0, 16).replace("T", " ") : ""))
          ),
          h("button", { className: "cr-btn ghost", onClick: () => onDelete(x.id) }, "删")
        ))
      );
    }

    function MiniChart({ series, unit }) {
      const list = (series || []).filter((s) => s && s.points && s.points.length);
      if (!list.length) return null;
      const W = 600, H = 130, pad = { l: 34, r: 12, t: 12, b: 22 };
      const all = list.flatMap((s) => s.points.map((p) => Number(p.y)));
      let min = Math.min(...all), max = Math.max(...all);
      if (max === min) { min -= 1; max += 1; }
      const span = max - min; min -= span * 0.12; max += span * 0.12;
      const maxLen = Math.max(...list.map((s) => s.points.length));
      const x = (i) => pad.l + (maxLen <= 1 ? (W - pad.l - pad.r) / 2 : i * (W - pad.l - pad.r) / (maxLen - 1));
      const y = (v) => pad.t + (1 - (Number(v) - min) / (max - min)) * (H - pad.t - pad.b);
      const grid = [];
      for (let i = 0; i <= 2; i++) {
        const v = min + (max - min) * i / 2; const yy = y(v);
        grid.push(h("line", { key: "g" + i, x1: pad.l, x2: W - pad.r, y1: yy, y2: yy, stroke: "var(--dsw-alias-border-l1,rgba(0,0,0,.10))" }));
        grid.push(h("text", { key: "t" + i, x: 3, y: yy + 3 }, fmt(v)));
      }
      return h("div", null,
        h("svg", { viewBox: "0 0 " + W + " " + H, className: "cr-chart" },
          grid,
          list.map((s) => h("g", { key: s.label },
            h("path", { d: s.points.map((p, i) => (i ? "L" : "M") + x(i) + " " + y(p.y)).join(" "), fill: "none", stroke: s.color || "#D24B36", strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" }),
            s.points.map((p, i) => h("circle", { key: i, cx: x(i), cy: y(p.y), r: 3, fill: "#FAFAFA", stroke: s.color || "#D24B36", strokeWidth: 1.8 }))
          )),
          h("text", { x: W - pad.r, y: 10, textAnchor: "end" }, unit || "")
        ),
        h("div", { className: "cr-legend" }, list.map((s) => h("span", { key: s.label }, h("i", { style: { background: s.color || "#D24B36" } }), s.label)))
      );
    }

    function HospitalBagCard({ bag, onToggle, onAdd }) {
      const sections = (bag && bag.sections) || [];
      const total = (bag && bag.total) || 0;
      const done = (bag && bag.done) || 0;
      return h("div", { className: "cr-card" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "待产包", h("div", { className: "cr-metrics" },
          h("span", { className: "cr-mut" }, done + "/" + total + " 已准备"),
          h("button", { className: "cr-btn ghost", onClick: onAdd }, "加一条")
        )),
        sections.length ? sections.map((sec) => h("div", { key: sec.title, style: { marginTop: "6px" } },
          h("div", { className: "cr-mut", style: { fontWeight: 600 } }, sec.title),
          sec.items.map((it) => h("div", { className: "cr-bag-item", key: it.text },
            h("button", { className: "cr-todo-check", "aria-label": it.done ? "取消勾选" : "勾选", onClick: () => onToggle(it.text, !it.done) }),
            h("span", { style: { textDecoration: it.done ? "line-through" : "none", opacity: it.done ? .55 : 1 } }, it.text)
          ))
        )) : h("div", { className: "cr-empty" }, "还没有待产包清单；建工作区会自动生成基础清单。"),
        h("div", { className: "cr-mut", style: { marginTop: "6px" } }, "基础清单可自己改/补；按医院要求为准。")
      );
    }

    function PreconceptionPanel({ overview, onAll }) {
      const prep = (overview && overview.prep) || { cycles: [], checkups: [] };
      const cycles = prep.cycles || [];
      const latest = cycles[cycles.length - 1];
      return h("div", { id: "cr-preconception" },
        h("div", { className: "cr-card" },
          h("div", { className: "cr-sec", style: { marginTop: 0 } }, "备孕记录 · 按次", h("div", { className: "cr-metrics" }, h("span", { className: "cr-mut" }, "周期 / 检查"), onAll ? h("button", { className: "cr-btn ghost", onClick: () => onAll("prep") }, "全部") : null)),
          h("div", { className: "cr-statline" },
            h("div", { className: "cr-stat" }, h("b", null, latest && latest.length ? latest.length + " 天" : "—"), h("span", null, "最近周期")),
            h("div", { className: "cr-stat" }, h("b", null, cycles.length), h("span", null, "周期记录")),
            h("div", { className: "cr-stat" }, h("b", null, (prep.checkups || []).length), h("span", null, "孕前检查") )
          ),
          cycles.length > 1 ? h(MiniChart, { unit: "天", series: [{ label: "周期长度", color: "#D24B36", points: cycles.map((r) => ({ x: r.start, y: Number(r.length) })).filter((p) => Number.isFinite(p.y)) }] }) : null,
          cycles.length ? h("div", { className: "cr-table-wrap", style: { marginTop: "8px" } },
            h("table", { className: "cr-table" },
              h("thead", null, h("tr", null, ["开始", "结束", "长度", "经量"].map((x) => h("th", { key: x, className: x === "长度" ? "num" : "" }, x)))),
              h("tbody", null, cycles.slice(-8).reverse().map((r, i) => h("tr", { key: i },
                h("td", null, r.start || "—"), h("td", null, r.end || "—"),
                h("td", { className: "num" }, r.length || "—"), h("td", null, r.flow || "—")
              )))
            )
          ) : h("div", { className: "cr-empty" }, "还没有周期记录。")
        ),
        (prep.checkups || []).length ? h("div", { className: "cr-card" },
          h("div", { className: "cr-sec", style: { marginTop: 0 } }, "孕前检查"),
          h("div", { className: "cr-table-wrap" },
            h("table", { className: "cr-table" },
              h("thead", null, h("tr", null, ["日期", "项目", "结果", "建议"].map((x) => h("th", { key: x }, x)))),
              h("tbody", null, prep.checkups.map((r, i) => h("tr", { key: i },
                h("td", null, r.date || "—"), h("td", null, r.item || "—"),
                h("td", null, r.result || "—"), h("td", null, r.advice || "—")
              )))
            )
          )
        ) : null
      );
    }

    function BirthModal({ pregnancy, onClose, onSaved }) {
      const [birthDate, setBirthDate] = useState(todayISO());
      const [babies, setBabies] = useState([{ name: "", sex: "" }]);
      const [err, setErr] = useState("");
      const [busy, setBusy] = useState(false);
      const setBaby = (i, k, v) => setBabies((list) => list.map((b, j) => j === i ? { ...b, [k]: v } : b));
      async function save() {
        const clean = babies.map((b) => ({ name: b.name.trim(), sex: b.sex.trim() })).filter((b) => b.name);
        if (!clean.length) { setErr("先填宝宝小名"); return; }
        setBusy(true); setErr("");
        const r = await api("/birth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pregnancyId: pregnancy.id, birthDate, babies: clean }) }).catch(() => null);
        setBusy(false);
        if (!r || !r.ok) { setErr((r && r.error) || "保存失败"); return; }
        onSaved && await onSaved(r);
        onClose && onClose();
      }
      return h("div", { className: "cr-overlay", onClick: onClose },
        h("div", { className: "cr-sheet", onClick: (e) => e.stopPropagation() },
          h("h3", null, "宝宝出生了"),
          h("div", { className: "cr-mut", style: { marginBottom: "8px", lineHeight: 1.6 } }, "出生后建孩子档案；孕期数据只保留一份，不会复制。双胞胎就填两个名字。"),
          h("div", { className: "cr-field" }, h("label", null, "出生日期"), h("input", { type: "date", value: birthDate, max: todayISO(), onChange: (e) => setBirthDate(e.target.value) })),
          babies.map((b, i) => h("div", { className: "cr-field", key: i },
            h("label", null, babies.length > 1 ? "宝宝 " + (i + 1) + " 小名" : "宝宝小名"),
            h("div", { style: { display: "flex", gap: "5px" } },
              h("input", { value: b.name, onChange: (e) => setBaby(i, "name", e.target.value), placeholder: "小名", style: { flex: 1 } }),
              h("input", { value: b.sex, onChange: (e) => setBaby(i, "sex", e.target.value), placeholder: "性别（可不填）", style: { width: "110px" } })
            )
          )),
          h("div", { className: "cr-metrics", style: { marginTop: "4px" } },
            h("button", { className: "cr-btn ghost", onClick: () => setBabies((list) => list.length >= 4 ? list : [...list, { name: "", sex: "" }]) }, "加一个宝宝（双胞胎）")
          ),
          err ? h("div", { className: "cr-mut", style: { color: "#D24B36" } }, err) : null,
          h("div", { className: "cr-metrics", style: { marginTop: "10px" } },
            h("button", { className: "cr-btn primary", disabled: busy, onClick: save }, busy ? "保存中…" : "建立孩子档案"),
            h("button", { className: "cr-btn ghost", onClick: onClose }, "取消")
          )
        )
      );
    }

    function EddModal({ child, onClose, onSaved }) {
      const c = child || {};
      const [dueDate, setDueDate] = useState(c.dueDate || "");
      const [source, setSource] = useState(c.dueDateSource || "hospital");
      const [hospital, setHospital] = useState(c.dueDateHospital || "");
      const [lmp, setLmp] = useState(c.lmp || "");
      const [scanDate, setScanDate] = useState(c.ultrasoundDate || "");
      const [gaWeeks, setGaWeeks] = useState(c.ultrasoundGaDays ? Math.floor(Number(c.ultrasoundGaDays) / 7) : "");
      const [gaDays, setGaDays] = useState(c.ultrasoundGaDays ? Number(c.ultrasoundGaDays) % 7 : "");
      const [nextCheckup, setNextCheckup] = useState(c.nextCheckup || "");
      const [err, setErr] = useState("");
      const [busy, setBusy] = useState(false);
      const addDays = (iso, n) => {
        const d = new Date(String(iso) + "T00:00:00Z");
        if (Number.isNaN(d.getTime())) return "";
        d.setUTCDate(d.getUTCDate() + Number(n));
        return d.toISOString().slice(0, 10);
      };
      const gaTotal = Number(gaWeeks || 0) * 7 + Number(gaDays || 0);
      const calcLmp = () => { if (lmp) { setSource("lmp"); setDueDate(addDays(lmp, 280)); } };
      const calcScan = () => { if (scanDate && gaTotal > 0) { setSource("ultrasound"); setDueDate(addDays(scanDate, 280 - gaTotal)); } };
      async function save() {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) { setErr("请填预产期日期"); return; }
        setBusy(true); setErr("");
        const r = await api("/pregnancy/edd", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId: c.id, dueDate, source, hospital, lmp, ultrasoundDate: scanDate, ultrasoundGaDays: gaTotal, nextCheckup }) }).catch(() => null);
        setBusy(false);
        if (!r || !r.ok) { setErr((r && r.error) || "保存失败"); return; }
        onSaved && await onSaved(r);
        onClose && onClose();
      }
      return h("div", { className: "cr-overlay", onClick: onClose },
        h("div", { className: "cr-sheet", onClick: (e) => e.stopPropagation() },
          h("h3", null, "预产期基准"),
          h("div", { className: "cr-mut", style: { marginBottom: "8px", lineHeight: 1.5 } }, "以医院/医生给的预产期为准；下面两种只用于医院还没给值时估算。更新后所有孕周提醒会按新日期重排。"),
          h("div", { className: "cr-field" }, h("label", null, "预产期（医院值）"), h("input", { type: "date", value: dueDate, onChange: (e) => setDueDate(e.target.value) })),
          h("div", { className: "cr-field" }, h("label", null, "来源"), h("select", { value: source, onChange: (e) => setSource(e.target.value) },
            h("option", { value: "hospital" }, "医院 / 医生"),
            h("option", { value: "manual" }, "手动填写"),
            h("option", { value: "ultrasound" }, "早期超声估算"),
            h("option", { value: "lmp" }, "末次月经估算")
          )),
          h("div", { className: "cr-field" }, h("label", null, "医院（可不填）"), h("input", { value: hospital, onChange: (e) => setHospital(e.target.value), placeholder: "建档/产检医院" })),
          h("div", { className: "cr-field" }, h("label", null, "末次月经（用于估算）"), h("input", { type: "date", value: lmp, onChange: (e) => setLmp(e.target.value) }),
            h("button", { className: "cr-btn ghost", style: { marginTop: "4px" }, onClick: calcLmp }, "按末次月经算")),
          h("div", { className: "cr-field" }, h("label", null, "早期超声（用于估算）"),
            h("div", { style: { display: "flex", gap: "5px", flexWrap: "wrap" } },
              h("input", { type: "date", value: scanDate, onChange: (e) => setScanDate(e.target.value), style: { flex: "1 1 120px" } }),
              h("input", { type: "number", min: 0, max: 45, value: gaWeeks, onChange: (e) => setGaWeeks(e.target.value), placeholder: "周", style: { width: "60px" } }),
              h("input", { type: "number", min: 0, max: 6, value: gaDays, onChange: (e) => setGaDays(e.target.value), placeholder: "天", style: { width: "55px" } })
            ),
            h("button", { className: "cr-btn ghost", style: { marginTop: "4px" }, onClick: calcScan }, "按超声算")),
          h("div", { className: "cr-field" }, h("label", null, "下次产检（可不填）"), h("input", { type: "date", value: nextCheckup, onChange: (e) => setNextCheckup(e.target.value) })),
          err ? h("div", { className: "cr-mut", style: { color: "#D24B36" } }, err) : null,
          h("div", { className: "cr-metrics", style: { marginTop: "8px" } },
            h("button", { className: "cr-btn primary", disabled: busy, onClick: save }, busy ? "保存中…" : "保存"),
            h("button", { className: "cr-btn ghost", onClick: onClose }, "取消")
          )
        )
      );
    }

    function PregnancyPanel({ overview, section = "all", onRemind, onForm, onAll, onToggleBag, onEdd }) {
      const p = (overview && overview.pregnancy) || { vitals: [], checkups: [], reports: [], meds: [], meals: [], basic: {} };
      const vitals = p.vitals || [];
      const latest = vitals[vitals.length - 1];
      const reports = p.reports || [];
      const meds = p.meds || [];
      const meals = p.meals || [];
      const week = Number(p.week);
      const basic = p.basic || {};
      const preWeight = Number(basic.preWeight);
      const height = Number(basic.height);
      const bmi = preWeight > 0 && height > 0 ? preWeight / Math.pow(height / 100, 2) : undefined;
      const gainRange = bmi === undefined ? null : bmi < 18.5 ? [12.5, 18] : bmi < 24 ? [11.5, 16] : bmi < 28 ? [7, 11.5] : [5, 9];
      const totalGain = latest && latest.weight && preWeight > 0 ? (Number(latest.weight) - preWeight) : undefined;
      const current = PREGNANCY_MILESTONES.find((m) => week >= m.start && week <= m.end);
      const next = PREGNANCY_MILESTONES.find((m) => week < m.start);
      const today = todayISO();
      const milestoneDate = (m) => pregnancyDate(p.dueDate, m.start);
      const sourceLabel = p.dueDateSource === "hospital" ? "医院" : p.dueDateSource === "ultrasound" ? "早期超声" : p.dueDateSource === "lmp" ? "末次月经" : p.dueDateSource === "manual" ? "手动" : "未标记";
      return h("div", { id: "cr-pregnancy", className: "cr-preg-view " + section },
        h("div", { id: "cr-preg-edd", className: "cr-card cr-edd-card cr-preg-card edd" },
          h("div", { className: "cr-sec", style: { marginTop: 0 } }, "预产期基准", h("div", { className: "cr-metrics" }, h("span", { className: "cr-mut" }, sourceLabel), onEdd ? h("button", { className: "cr-btn ghost", onClick: () => onEdd((overview && overview.child) || {}) }, "校正") : null)),
          h("div", { className: "cr-edd-main" },
            h("b", null, p.dueDate || "未填预产期"),
            p.week !== undefined ? h("span", null, "孕 " + p.week + " 周") : null
          ),
          h("div", { className: "cr-mut", style: { lineHeight: 1.6 } },
            p.dueDateHospital ? "医院：" + p.dueDateHospital + " · " : "",
            p.dueDateUpdatedAt ? "更新于 " + p.dueDateUpdatedAt : "",
            p.nextCheckup ? " · 下次产检 " + p.nextCheckup : ""
          ),
          h("div", { className: "cr-ref-note" }, "以医院/医生给的预产期为准；末次月经和超声算的只作估算。改基准后孕周和提醒会重排。")
        ),
        h("div", { id: "cr-preg-vitals", className: "cr-card cr-preg-card vitals" },
          h("div", { className: "cr-sec", style: { marginTop: 0 } }, "体重监控 · 按孕周/次", h("div", { className: "cr-metrics" }, h("button", { className: "cr-btn ghost", onClick: () => onForm && onForm("pregnancyBasic") }, preWeight ? "改孕前数据" : "填孕前数据"), onAll ? h("button", { className: "cr-btn ghost", onClick: () => onAll("pregnancy") }, "全部") : null)),
          preWeight && height ? h("div", null,
            h("div", { className: "cr-statline" },
              h("div", { className: "cr-stat" }, h("b", null, latest && latest.weight ? latest.weight + " kg" : "—"), h("span", null, "最近体重")),
              h("div", { className: "cr-stat" }, h("b", null, totalGain !== undefined ? (totalGain >= 0 ? "+" : "") + totalGain.toFixed(1) + " kg" : "—"), h("span", null, "孕期增重")),
              h("div", { className: "cr-stat" }, h("b", null, bmi.toFixed(1)), h("span", null, "孕前 BMI")),
              h("div", { className: "cr-stat" }, h("b", null, gainRange ? gainRange[0] + "–" + gainRange[1] + " kg" : "—"), h("span", null, "总增重参考"))
            ),
            h("div", { className: "cr-ref-note" }, "参考结论：孕前 " + preWeight + " kg / " + height + " cm，BMI " + (bmi === undefined ? "—" : bmi.toFixed(1)) + "；整个孕期总增重参考 " + gainRange[0] + "–" + gainRange[1] + " kg（这是全程范围，不是现在就要涨这么多）。目前增重 " + (totalGain !== undefined ? (totalGain >= 0 ? "+" : "") + totalGain.toFixed(1) + " kg" : "还没记录") + "，孕 " + week + " 周还早，单次不说明问题；按产科医生的目标看。"),
            h("div", { className: "cr-mut", style: { marginTop: "4px", lineHeight: 1.6 } }, "按孕前 BMI 的孕期总增重参考范围，不是诊断，也不替代产科医生。")
          ) : h("div", { className: "cr-mut" }, "填孕前体重和身高，才能算孕期增重参考。"),
          h("div", { className: "cr-sec" }, "孕期数据", h("span", { className: "cr-mut" }, p.dueDate ? "预产期 " + p.dueDate : "预产期未填")),
          h("div", { className: "cr-statline" },
            h("div", { className: "cr-stat" }, h("b", null, p.week !== undefined ? p.week + " 周" : "—"), h("span", null, "当前孕周")),
            h("div", { className: "cr-stat" }, h("b", null, latest && latest.weight ? latest.weight + " kg" : "—"), h("span", null, "最近体重")),
            h("div", { className: "cr-stat" }, h("b", null, latest && latest.systolic ? latest.systolic + "/" + latest.diastolic : "—"), h("span", null, "最近血压")),
            h("div", { className: "cr-stat" }, h("b", null, reports.length), h("span", null, "孕检报告"))
          ),
          vitals.length > 1 ? h("div", { className: "cr-mut", style: { marginTop: "6px" } }, "按记录 · 体重趋势") : null,
          vitals.length > 1 ? h(MiniChart, { unit: "kg", series: [{ label: "体重", color: "rgba(210,75,54,.55)", points: vitals.map((r) => ({ x: r.date, y: Number(r.weight) })).filter((x) => Number.isFinite(x.y)) }] }) : null,
          vitals.length > 1 ? h("div", { className: "cr-mut", style: { marginTop: "4px" } }, "按记录 · 血压趋势") : null,
          vitals.length > 1 ? h(MiniChart, { unit: "mmHg", series: [
            { label: "收缩压", color: "#D24B36", points: vitals.map((r) => ({ x: r.date, y: Number(r.systolic) })).filter((x) => Number.isFinite(x.y)) },
            { label: "舒张压", color: "rgba(210,75,54,.55)", points: vitals.map((r) => ({ x: r.date, y: Number(r.diastolic) })).filter((x) => Number.isFinite(x.y)) },
          ] }) : null,
          vitals.length ? h("div", { className: "cr-table-wrap", style: { marginTop: "8px" } },
            h("table", { className: "cr-table" },
              h("thead", null, h("tr", null, ["日期", "孕周", "体重", "血压"].map((x) => h("th", { key: x, className: ["孕周", "体重", "血压"].includes(x) ? "num" : "" }, x)))),
              h("tbody", null, vitals.slice(-8).reverse().map((r, i) => h("tr", { key: i },
                h("td", null, r.date || "—"), h("td", { className: "num" }, r.week || "—"),
                h("td", { className: "num" }, r.weight || "—"),
                h("td", { className: "num" }, r.systolic ? r.systolic + "/" + r.diastolic : "—")
              )))
            )
          ) : h("div", { className: "cr-empty" }, "还没有孕期体重/血压记录。")
        ),
        h("div", { id: "cr-preg-bag", className: "cr-preg-card bag" }, h(HospitalBagCard, { bag: p.bag || (overview && overview.hospitalBag), onToggle: (text, done) => onToggleBag && onToggleBag(text, done), onAdd: () => onForm && onForm("bagAdd") })),
        h("div", { id: "cr-preg-reminders", className: "cr-card cr-preg-card edd" },
          h("div", { className: "cr-sec", style: { marginTop: 0 } }, "阶段提醒", h("span", { className: "cr-mut" }, "按孕周，不替代医生")),
          current ? h("div", { className: "cr-stage-note" }, h("b", null, "现在 " + week + " 周：" + current.title), h("span", null, current.note)) : null,
          next ? h("div", { className: "cr-stage-note" }, h("b", null, "下一个：" + next.title), h("span", null, next.note + (milestoneDate(next) ? " · " + milestoneDate(next) : ""))) : null,
          h("div", { className: "cr-table-wrap", style: { marginTop: "6px" } },
            h("table", { className: "cr-table" },
              h("thead", null, h("tr", null, h("th", null, "孕周"), h("th", null, "节点"), h("th", null, "提醒"))),
              h("tbody", null, PREGNANCY_MILESTONES.map((m, i) => {
                const date = milestoneDate(m);
                const passed = date && date < today;
                return h("tr", { key: i },
                  h("td", { className: "num" }, m.start + "–" + m.end + " 周"),
                  h("td", null, m.title, h("div", { className: "cr-mut" }, m.note)),
                  h("td", null, date
                    ? (passed ? h("span", { className: "cr-mut" }, "已过 " + date) : h("button", { className: "cr-btn ghost", onClick: () => onRemind && onRemind({ ...m, date }) }, "设提醒"))
                    : h("span", { className: "cr-mut" }, "填预产期"))
                );
              }))
            )
          ),
          h("div", { className: "cr-mut", style: { marginTop: "6px" } }, "提醒只按孕周和预产期算；具体项目/时间以产检医生为准。")
        ),
        h("div", { id: "cr-preg-reports", className: "cr-card cr-preg-card reports" },
          h("div", { className: "cr-sec", style: { marginTop: 0 } }, "孕检报告归集", h("span", { className: "cr-mut" }, "只存摘要，不存原图")),
          reports.length ? h("div", { className: "cr-table-wrap" },
            h("table", { className: "cr-table" },
              h("thead", null, h("tr", null, ["日期", "孕周", "报告", "关键指标/结论", "医生建议"].map((x) => h("th", { key: x, className: x === "孕周" ? "num" : "" }, x)))),
              h("tbody", null, reports.slice().reverse().map((r, i) => h("tr", { key: i },
                h("td", null, r.date || "—"), h("td", { className: "num" }, r.week || "—"),
                h("td", null, r.report || "—"), h("td", null, r.findings || "—"), h("td", { className: "dim" }, r.advice || "—")
              )))
            )
          ) : h("div", { className: "cr-empty" }, "还没有报告。发图给聊天，我读后跳过隐私字段，只填报告摘要。")
        ),
        h("div", { id: "cr-preg-meds", className: "cr-card cr-preg-card meds" },
          h("div", { className: "cr-sec", style: { marginTop: 0 } }, "孕期用药 / 补剂", h("span", { className: "cr-mut" }, "只记录，不推荐")),
          meds.length ? h("div", { className: "cr-table-wrap" },
            h("table", { className: "cr-table" },
              h("thead", null, h("tr", null, ["名称", "剂量", "频率", "时间"].map((x) => h("th", { key: x }, x)))),
              h("tbody", null, meds.map((r, i) => h("tr", { key: i },
                h("td", null, r.name || "—"), h("td", null, r.dose || "—"),
                h("td", null, r.frequency || "—"), h("td", null, r.time || "—")
              )))
            )
          ) : h("div", { className: "cr-empty" }, "暂无记录。仅记录医嘱或家长填报内容。")
        ),
        h("div", { id: "cr-preg-meals", className: "cr-card cr-preg-card meals" },
          h("div", { className: "cr-sec", style: { marginTop: 0 } }, "孕期饮食", h("span", { className: "cr-mut" }, "吃了什么，不做诊断")),
          meals.length ? h("div", { className: "cr-table-wrap" },
            h("table", { className: "cr-table" },
              h("thead", null, h("tr", null, ["日期", "餐次", "吃了什么"].map((x) => h("th", { key: x }, x)))),
              h("tbody", null, meals.slice(-8).reverse().map((r, i) => h("tr", { key: i },
                h("td", null, r.date || "—"), h("td", null, r.meal || "—"), h("td", null, r.food || "—")
              )))
            )
          ) : h("div", { className: "cr-empty" }, "还没有饮食记录。")
        ),
        (p.checkups || []).length ? h("div", { id: "cr-preg-checkups", className: "cr-card cr-preg-card checkup" },
          h("div", { className: "cr-sec", style: { marginTop: 0 } }, "产检汇总"),
          h("div", { className: "cr-table-wrap" },
            h("table", { className: "cr-table" },
              h("thead", null, h("tr", null, ["日期", "孕周", "项目", "结果", "医生建议"].map((x) => h("th", { key: x, className: x === "孕周" ? "num" : "" }, x)))),
              h("tbody", null, p.checkups.map((r, i) => h("tr", { key: i },
                h("td", null, r.date || "—"), h("td", { className: "num" }, r.week || "—"),
                h("td", null, r.item || "—"), h("td", null, r.result || "—"), h("td", null, r.advice || "—")
              )))
            )
          )
        ) : null
      );
    }

    function QuickActions({ actions, onForm, onRefresh }) {
      const [more, setMore] = useState(false);
      if (!actions || !actions.length) return null;
      const visible = more ? actions : actions.slice(0, 6);
      return h("div", { className: "cr-quick-wrap" },
        h("div", { className: "cr-quick-head" }, h("span", { className: "cr-sec", style: { margin: 0 } }, "记一笔"),
          h("div", { className: "cr-metrics" },
            actions.length > 6 ? h("button", { className: "cr-btn ghost", onClick: () => setMore(!more) }, more ? "收起" : "更多") : null,
            h("button", { className: "cr-btn ghost", onClick: onRefresh }, "刷新"))),
        h("div", { className: "cr-quick-grid" }, visible.map((id) => h("button", {
          key: id, className: "cr-quick", onClick: () => onForm(id),
        }, h("div", { className: "cr-quick-top" },
          h("span", { className: "cr-quick-icon" }, (QUICK[id] && QUICK[id].icon) || "·"),
          h("b", null, QUICK[id] ? QUICK[id].title : id)),
          h("span", null, QUICK[id] ? QUICK[id].desc : ""))))
      );
    }

    function StagePanel({ child }) {
      const stage = (child && child.stage) || {};
      const copy = {
        preconception: ["备孕", "这个阶段看：月经周期、孕前检查、叶酸/疫苗、情绪与睡眠。", "周期和孕前检查可直接记；叶酸/情绪先走聊天。"],
        pregnancy: ["孕期", "这个阶段看：孕周、产检、孕检报告、体重/血压、用药/补剂、饮食、情绪、待产清单。", "孕周、体重血压、产检、报告摘要、用药/补剂、饮食可直接记；胎动/待产清单先走聊天。"],
        newborn: ["新生儿", "这个阶段看：喂养、大小便、黄疸、睡眠、妈妈恢复。", "日常表、生长、疫苗、体检、里程碑已就位。"],
        preschool: ["自由模式（3 岁+）", "核心模板到 0–3 岁；3 岁后不再套固定表。", "自定义表单由家长创建，内置模板更新不会覆盖。"],
        school: ["自由模式（6 岁+）", "内置模板覆盖孕期至 3 岁；3 岁后由家长定义记录内容。", "自定义表单和记录都在 自定义/ 目录，和未来模板不冲突。"],
      }[stage.key];
      if (!copy) return null;
      return h("div", { className: "cr-card cr-stage" },
        h("div", { className: "cr-kicker" }, h("span", { className: "cr-chip" }, copy[0])),
        h("h3", { className: "cr-h3" }, copy[0]),
        h("p", { className: "cr-p" }, copy[1]),
        h("div", { className: "cr-mut" }, copy[2])
      );
    }

    function FamilyExpenseCard({ items }) {
      const rows = (items || []).map((o) => ({ name: (o.child && o.child.name) || "孩子", amount: Number(o.expenseSummary && o.expenseSummary.total) || 0, count: Number(o.expenseSummary && o.expenseSummary.count) || 0 })).filter((r) => r.amount > 0);
      const total = rows.reduce((a, r) => a + r.amount, 0);
      return h("div", { className: "cr-card" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, "全家花费", h("span", { className: "cr-mut" }, "唯一可跨档案合计的指标")),
        total ? h("div", null,
          h("div", { className: "cr-statline" }, h("div", { className: "cr-stat" }, h("b", null, "¥" + Math.round(total).toLocaleString("zh-CN")), h("span", null, "全部已记花费"))),
          h("div", { className: "cr-table-wrap" }, h("table", { className: "cr-table" },
            h("thead", null, h("tr", null, h("th", null, "孩子"), h("th", { className: "num" }, "已记花费"), h("th", { className: "num" }, "笔数"))),
            h("tbody", null, rows.map((r) => h("tr", { key: r.name }, h("td", null, r.name), h("td", { className: "num" }, "¥" + Math.round(r.amount).toLocaleString("zh-CN")), h("td", { className: "num" }, r.count))))
          ))
        ) : h("div", { className: "cr-mut" }, "还没有已记花费。身高/体重/奶量/疫苗等按孩子分别看，不做全家合计。"),
        h("div", { className: "cr-mut", style: { marginTop: "6px" } }, "只合计“已记花费”；估算、奶量、生长、疫苗等不跨孩子合并。")
      );
    }

    function FamilyPanel({ items, onOpen }) {
      if (!items || !items.length) return h("div", { className: "cr-card" }, h("div", { className: "cr-empty" }, "还没有孩子。"));
      return h("div", null, items.map((o) => {
        const c = o.child || {};
        const g = o.growth;
        const recent = (o.timeline && o.timeline[0]) || null;
        return h("div", { key: c.id, className: "cr-card" },
          h("div", { className: "cr-sec", style: { marginTop: 0 } }, c.name, h("span", { className: "cr-mut" }, c.ageShort || "")),
          h("div", { className: "cr-statline" },
            h("div", { className: "cr-stat" }, h("b", null, g ? g.height + " cm" : "—"), h("span", null, "身高")),
            h("div", { className: "cr-stat" }, h("b", null, g ? g.weight + " kg" : "—"), h("span", null, "体重")),
            h("div", { className: "cr-stat" }, h("b", null, (o.todos && o.todos.open) || 0), h("span", null, "待补")),
            h("div", { className: "cr-stat" }, h("b", null, (o.timeline && o.timeline.length) || 0), h("span", null, "最近记录") )
          ),
          recent ? h("div", { className: "cr-mut", style: { marginTop: "6px" } }, "最近：" + recent.text) : null,
          h("button", { className: "cr-btn primary", style: { marginTop: "8px" }, onClick: () => onOpen(c.id) }, "打开")
        );
      }));
    }

    function EstimateCard({ estimate, onConfirm, onDelete }) {
      const v = estimate.values || {};
      const parts = [];
      if (v.milk) parts.push("奶 " + v.milk);
      if (v.poop) parts.push("拉 " + v.poop);
      if (v.pee) parts.push("尿 " + v.pee);
      if (v.water) parts.push("水 " + v.water);
      return h("div", { className: "cr-card cr-estimate" },
        h("div", { className: "cr-sec", style: { marginTop: 0 } }, estimate.proposed ? "昨天的记录" : "今日推定", h("span", { className: "cr-mut" }, "待核实")),
        h("div", { className: "cr-p" }, estimate.proposed ? "今天还没记。昨天" + (estimate.from ? "（" + estimate.from + "）" : "") + "有：" + (parts.join(" / ") || "（无）") + "。要不要沿用？" : "今天还没记，我先按昨天" + (estimate.from ? "（" + estimate.from + "）" : "") + "记上了：" + (parts.join(" / ") || "（无）") + "。对吗？"),
        h("div", { className: "cr-chips" },
          h("button", { className: "cr-btn primary", onClick: onConfirm }, "对，就这样"),
          h("button", { className: "cr-btn", onClick: onDelete }, "删掉")
        ),
        h("div", { className: "cr-mut", style: { marginTop: "6px" } }, "推定值不算事实；核实后才转正。")
      );
    }

    function RightPanel(props) {
      useLocaleVersion();
      const [status, setStatus] = useState(null);
      const [overview, setOverview] = useState(null);
      const [active, setActive] = useState(childActions.activeId || "");
      const [form, setForm] = useState(null);
      const [toast, setToast] = useState("");
      const [busy, setBusy] = useState(false);
      const [viewMode, setViewMode] = useState("sections");
      const [family, setFamily] = useState(false);
      const [familyData, setFamilyData] = useState([]);
      const [showHistory, setShowHistory] = useState(false);
      const [freeNew, setFreeNew] = useState(false);
      const [freeForm, setFreeForm] = useState(null);
      const [freeRecords, setFreeRecords] = useState(null);
      const [allKind, setAllKind] = useState(null);
      const [showSummary, setShowSummary] = useState(false);
      const [showGuide, setShowGuide] = useState(false);
      const [page, setPage] = useState("all");
      const [scrollActive, setScrollActive] = useState("all");
      const [estimate, setEstimate] = useState(null);
      const [fillTodo, setFillTodo] = useState(null);
      const [eddOpen, setEddOpen] = useState(false);
      const [birthOpen, setBirthOpen] = useState(false);
      const [showOnboard, setShowOnboard] = useState(!childActions.onboardingDismissed);
      const [forceOnboard, setForceOnboard] = useState(!!childActions.forceOnboard);
      const [pregnancyView, setPregnancyView] = useState(false);
      const [pregPage, setPregPage] = useState("all");
      const [pregnancyReturnId, setPregnancyReturnId] = useState("");
      useEffect(() => {
        if (!status || !status.workspace) return;
        let dismissed = childActions.onboardingDismissed;
        try { dismissed = dismissed || localStorage.getItem(onboardKey(status.workspace)) === "1"; } catch { /* ignore */ }
        setShowOnboard(!dismissed);
      }, [status && status.workspace]);
      useEffect(() => {
        const hide = () => { setShowOnboard(false); setForceOnboard(false); childActions.forceOnboard = false; };
        const show = () => { setShowOnboard(true); setForceOnboard(true); childActions.forceOnboard = true; };
        window.addEventListener("cr-onboarding-dismissed", hide);
        window.addEventListener("cr-onboarding-show", show);
        return () => {
          window.removeEventListener("cr-onboarding-dismissed", hide);
          window.removeEventListener("cr-onboarding-show", show);
        };
      }, []);
      const [rootSession, setRootSession] = useState(false);
      const [rootDismissed, setRootDismissed] = useState("");
      const [reminders, setReminders] = useState([]);
      const children = (status && status.children) || [];
      const hookCurrent = props && typeof props.useSessions === "function" ? props.useSessions((s) => s && s.current) : undefined;
      const [sessionInfo, setSessionInfo] = useState({ id: "", cwd: "", title: "" });
      useEffect(() => {
        let timer;
        const read = () => {
          try {
            const ui = pluginCtx.get("uiWorkspace");
            const sessions = pluginCtx.get("sessions");
            const snap = sessions && sessions.list ? sessions.list.getSnapshot() : null;
            const main = ui && ui.mainReference && ui.mainReference.sessionId;
            const currentId = main || (snap && (snap.sessionId || snap.current));
            if (!currentId) return;
            const row = snap && snap.byId ? snap.byId[currentId] : null;
            setSessionInfo({ id: String(currentId), cwd: String((row && row.cwd) || ""), title: String((row && (row.title || row.displayTitle)) || "") });
          } catch { /* ignore */ }
        };
        read();
        timer = setInterval(read, 800);
        return () => clearInterval(timer);
      }, []);
      const currentSession = (props && props.sessionId) || hookCurrent || sessionInfo.id || "";
      useEffect(() => {
        const onActive = (e) => {
          const id = e && e.detail && e.detail.id;
          if (!id) return;
          setActive(id);
          setFamily(false);
          OVERVIEW_ETAGS.delete(id);
          loadOverview(id).then((o) => { if (o && o.ok && !o.notModified) setOverview(o); }).catch(() => {});
        };
        window.addEventListener("cr-child-active", onActive);
        return () => window.removeEventListener("cr-child-active", onActive);
      }, []);
      const ensuredWorkspaces = useRef(new Set());
      useEffect(() => {
        if (!status || !status.children || !status.children.length) return;
        const workspaces = pluginCtx.get("workspaces");
        if (!workspaces || typeof workspaces.create !== "function") return;
        for (const c of status.children) {
          const path = String(c.workspace || "");
          if (!path || path === String(status.workspace || "") || ensuredWorkspaces.current.has(path)) continue;
          ensuredWorkspaces.current.add(path);
          fetch(BASE + "/workspace/ensure", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId: c.id }) })
            .then(() => workspaces.create({ path }))
            .catch(() => { ensuredWorkspaces.current.delete(path); });
        }
      }, [status && status.workspace, status && status.children && status.children.length]);
      const autoPickedSession = useRef("");
      useEffect(() => {
        if (!currentSession || !status) return;
        if (autoPickedSession.current === currentSession) return;
        try {
          const bound = readSessionChild(currentSession);
          if (bound) {
            const bc = (status.children || []).find((c) => c.id === bound);
            if (bc) {
              autoPickedSession.current = currentSession;
              notifyActiveChild(bound);
              setActive(bound);
              setFamily(false);
              OVERVIEW_ETAGS.delete(bound);
              loadOverview(bound).then((o) => { if (o && o.ok && !o.notModified) setOverview(o); }).catch(() => {});
              return;
            }
          }
          const sessions = pluginCtx.get("sessions");
          const snap = sessions && sessions.list ? sessions.list.getSnapshot() : null;
          const row = sessionInfo.id === currentSession ? sessionInfo : (snap && snap.byId ? snap.byId[currentSession] : null);
          const cwd = String((row && row.cwd) || "").replace(/\/+$/, "");
          let hit = (status.children || []).find((c) => String(c.workspace || "").replace(/\/+$/, "") === cwd);
          if (hit) {
            autoPickedSession.current = currentSession;
            bindSessionChild(currentSession, hit.id);
            childActions.activeId = hit.id;
            setActive(hit.id);
            setFamily(false);
            OVERVIEW_ETAGS.delete(hit.id);
            loadOverview(hit.id).then((o) => { if (o && o.ok && !o.notModified) setOverview(o); }).catch(() => {});
          }
        } catch { /* use previous selection */ }
      }, [currentSession, sessionInfo.cwd, sessionInfo.title, status && status.children && status.children.length]);

      useEffect(() => {
        if (!status || active) return;
        try {
          const saved = localStorage.getItem("cr-last-child:" + String(status.workspace || pluginWorkspace || ""));
          if (saved && (status.children || []).some((c) => c.id === saved)) {
            childActions.activeId = saved;
            setActive(saved);
          }
        } catch { /* ignore */ }
      }, [status && status.workspace, status && status.children && status.children.length]);
      useEffect(() => {
        if (!active) return;
        try { localStorage.setItem("cr-last-child:" + String((status && status.workspace) || pluginWorkspace || ""), active); } catch { /* ignore */ }
      }, [active, status && status.workspace]);

      // 切换孩子/家庭视图时，推定提示必须跟着换，不能保留上一个孩子的旧提示。
      useEffect(() => {
        let alive = true;
        setEstimate(null);
        if (!active || family) return () => { alive = false; };
        routineSuggest(active).then((est) => {
          if (alive) setEstimate(est && est.pending ? est : null);
        }).catch(() => { if (alive) setEstimate(null); });
        return () => { alive = false; };
      }, [active, family]);

      const refresh = useCallback(async () => {
        const s = await loadStatus();
        setStatus(s);
        if (family) {
          const arr = [];
          for (const c of s.children || []) {
            OVERVIEW_ETAGS.delete(c.id);
            const o = await loadOverview(c.id);
            if (o && o.ok && !o.notModified) arr.push(o);
          }
          setFamilyData(arr);
          const rem = await loadReminders().catch(() => null);
          setReminders(rem && rem.ok ? rem.items : []);
          return;
        }
        const id = active || childActions.activeId || (s.children && s.children[0] && s.children[0].id) || "";
        childActions.activeId = id;
        setActive(id);
        if (id) {
          OVERVIEW_ETAGS.delete(id);
          const o = await loadOverview(id);
          if (o && o.ok && !o.notModified) setOverview(o);
          const est = await routineSuggest(id).catch(() => null);
          setEstimate(est && est.pending ? est : null);
          const rem = await loadReminders().catch(() => null);
          setReminders(rem && rem.ok ? rem.items : []);
        }
      }, [active, family]);

      useEffect(() => { refresh(); }, []);
      useEffect(() => {
        const timer = setInterval(() => {
          const wanted = childActions.activeId;
          if (!wanted || wanted === active || family) return;
          setActive(wanted);
          setPage("all");
          OVERVIEW_ETAGS.delete(wanted);
          loadOverview(wanted).then((o) => { if (o && o.ok && !o.notModified) setOverview(o); }).catch(() => {});
        }, 700);
        return () => clearInterval(timer);
      }, [active, family]);
      useEffect(() => { setPregPage("all"); if (!pregnancyReturnId) setPregnancyView(false); }, [active]);
      useEffect(() => { if (pregnancyView) { setPregPage("all"); setPage("all"); setScrollActive("all"); } }, [pregnancyView]);
      // 数据文件可能被对话/外部编辑修改：活动档案每 5 秒做一次轻量 overview 检查。
      useEffect(() => {
        if (!active || family) return;
        let alive = true;
        let timer;
        const tick = async () => {
          try {
            const o = await loadOverview(active);
            if (alive && o && o.ok && !o.notModified) setOverview(o);
          } catch { /* keep old */ }
          if (alive) timer = setTimeout(tick, 5000);
        };
        timer = setTimeout(tick, 5000);
        return () => { alive = false; clearTimeout(timer); };
      }, [active, family]);
      useEffect(() => {
        try {
          if (!currentSession || !status || family || !children.length || currentSession === rootDismissed) { setRootSession(false); return; }
          const sessions = pluginCtx.get("sessions");
          const snap = sessions && sessions.list ? sessions.list.getSnapshot() : null;
          const row = snap && snap.byId ? snap.byId[currentSession] : null;
          const base = String(status.workspace || "").replace(/\/+$/, "");
          const cwd = String((row && row.cwd) || "").replace(/\/+$/, "");
          setRootSession(!!base && cwd === base);
        } catch { setRootSession(false); }
      }, [currentSession, status && status.workspace, children.length, family, rootDismissed]);
      useEffect(() => {
        if (!status) return;
        widenRightPanel(420);
      }, [status && status.children && status.children.length]);
      useEffect(() => { if (family) refresh(); }, [family]);
      useEffect(() => {
        if (status === null || children.length) return;
        const timer = setInterval(() => { refresh(); }, 10000);
        return () => clearInterval(timer);
      }, [status === null, children.length]);

      useEffect(() => {
        if (family || !active) return;
        let stopped = false;
        let busy = false;
        const tick = async () => {
          if (busy) return;
          try {
            if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
            busy = true;
            const o = await loadOverview(active);
            if (!stopped && o && o.ok && !o.notModified) setOverview(o);
          } catch { /* ignore */ } finally { busy = false; }
        };
        const timer = setInterval(tick, 15000);
        const onVis = () => { if (typeof document !== "undefined" && document.visibilityState === "visible") tick(); };
        if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVis);
        return () => { stopped = true; clearInterval(timer); if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVis); };
      }, [active, family]);

      useEffect(() => {
        if (page !== "all" || family) return;
        const panel = document.querySelector(".cr-panel");
        if (!panel) return;
        const pairs = [
          ["daily", "cr-daily"], ["expense", "cr-expense"], ["growth", "cr-growth"], ["growth", "cr-nutrition"], ["growth", "cr-assessment"],
          ["vaccine", "cr-vaccine"], ["vaccine", "cr-checkup"], ["milestone", "cr-milestone"],
          ["specialSupplement", "cr-special-supplement"], ["specialSupplement", "cr-medication"],
          ["pregnancy", "cr-pregnancy"],
          ["preconception", "cr-preconception"], ["free", "cr-free"],
          ["guide", "cr-personality"], ["guide", "cr-stage-guide"],
          ["guide", "cr-reminders"],
        ];
        let raf = 0;
        const measure = () => {
          raf = 0;
          const bar = document.querySelector(".cr-jumps");
          const threshold = (bar ? bar.getBoundingClientRect().bottom : 0) + 6;
          let current = "all";
          for (const [key, id] of pairs) {
            const el = document.getElementById(id);
            if (el && el.getBoundingClientRect().top <= threshold) current = key;
          }
          setScrollActive(current);
        };
        const tick = () => { if (!raf) raf = requestAnimationFrame(measure); };
        measure();
        panel.addEventListener("scroll", tick, { passive: true });
        return () => {
          panel.removeEventListener("scroll", tick);
          if (raf) cancelAnimationFrame(raf);
        };
      }, [page, family, active, status && status.children && status.children.length]);

      const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 1800); };
      const avatarInputRef = useRef(null);
      async function changeAvatar(file) {
        if (!file) return;
        try {
          const dataUrl = await fileToAvatarDataUrl(file);
          const r = await api("/avatar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId: active, dataUrl }) });
          if (!r || !r.ok) { showToast((r && r.error) || "头像保存失败"); return; }
          showToast("头像已更新");
          await refresh();
        } catch (e) { showToast(String(e && e.message ? e.message : e)); }
        finally { if (avatarInputRef.current) avatarInputRef.current.value = ""; }
      }
      const scrollPreg = (id) => {
        try {
          if (id === "top") { const p = document.querySelector(".cr-panel"); if (p) p.scrollTo({ top: 0, behavior: "smooth" }); return; }
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch { /* ignore */ }
      };

      const submit = async (values) => {
        const def = FORMS[form];
        if (!def || !active) return;
        const err = def.validate ? def.validate(values) : "";
        if (err) { showToast(err); return; }
        setBusy(true);
        const r = def.kind === "bagAdd"
          ? await api("/bag/add", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId: active, section: values.section, text: values.text }) })
          : await postWrite(active, def.kind, def.build(values));
        setBusy(false);
        if (!r.ok) { showToast(r.error || "写入失败"); return; }
        setForm(null);
        showToast(r.receipt || "记下了");
        if ((def.kind === "medication" || def.kind === "specialSupplement" || def.kind === "pregnancyMed") && values.time && values.name) {
          const rem = await postReminder(active, { name: values.name, time: values.time, kind: def.kind }).catch(() => null);
          if (rem && rem.ok) showToast("已记；每天 " + values.time + " 提醒已建");
          else showToast("已记；提醒没建成（DSH 定时任务不可用？）");
        }
        await refresh();
      };

      async function resolveEstimate(action) {
        if (!active) return;
        try {
          await routineConfirm(active, action, { values: estimate && estimate.values, from: estimate && estimate.from });
          setEstimate(null);
          await refresh();
        } catch (e) { showToast(String(e && e.message ? e.message : e)); }
      }

      async function makePregnancyReminder(item) {
        const p = overview && overview.pregnancy;
        if (!p || !p.dueDate) { showToast("先在设置里填预产期"); return; }
        const date = pregnancyDate(p.dueDate, item.start);
        if (!date || date < todayISO()) { showToast("这个节点已经过了"); return; }
        const r = await api("/pregnancy-reminder", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: item.title, date, childId: active }),
        }).catch(() => null);
        showToast(r && r.ok ? "已设提醒：" + date : ((r && r.error) || "提醒没建成"));
        await refresh();
      }

      async function makeReminder(item) {
        if (!item || !item.name || !item.time) return;
        const r = await postReminder(active, { name: item.name, time: item.time, kind: item.kind === "用药" ? "medication" : "specialSupplement" }).catch(() => null);
        showToast(r && r.ok ? "每天 " + item.time + " 提醒已建" : ((r && r.error) || "提醒没建成"));
        await refresh();
      }

      async function removeReminder(id) {
        const r = await deleteReminder(id).catch(() => null);
        showToast(r && r.ok ? "提醒已删" : ((r && r.error) || "删除失败"));
        await refresh();
      }

      async function toggleBagItem(text, done) {
        const r = await api("/bag/toggle", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId: active, text, done }) }).catch(() => null);
        showToast(r && r.ok ? (done ? "已勾选" : "已取消") : ((r && r.error) || "更新失败"));
        await refresh();
      }

      async function confirmPendingItem(id) {
        const r = await api("/pending/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId: active, id }) }).catch(() => null);
        showToast(r && r.ok ? "已确认写入" : ((r && r.error) || "确认失败"));
        await refresh();
      }

      async function cancelPendingItem(id) {
        const r = await api("/pending/cancel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId: active, id }) }).catch(() => null);
        showToast(r && r.ok ? "已取消" : ((r && r.error) || "取消失败"));
        await refresh();
      }

      async function answerTodoItem(item, answer) {
        const r = await api("/todo/answer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId: active, text: item.raw || item.text, answer }) }).catch(() => null);
        showToast(r && r.ok ? "已填写" : ((r && r.error) || "保存失败"));
        if (r && r.ok) { setFillTodo(null); await refresh(); }
      }

      async function carryOverItem(item) {
        const r = await postWrite(active, item.kind, item.payload).catch(() => null);
        showToast(r && r.ok ? "已沿用今天的记录" : ((r && r.error) || "沿用失败"));
        await refresh();
      }

      async function saveExpenseEstimate(est) {
        if (!est || !est.ok) { showToast("没有可保存的估算"); return; }
        const payload = {
          date: todayISO(), text: "本月育儿花费估算", item: "本月育儿花费估算（示例均价）",
          expenseCategory: "预估", amount: est.monthly, payer: "估算",
          note: "按示例均价估算；不是实际支出",
        };
        const r = await postWrite(active, "expense", payload).catch(() => null);
        showToast(r && r.ok ? "估算已保存为「预估」" : ((r && r.error) || "保存失败"));
        await refresh();
      }

      async function openBlankChat(st, draftText) {
        if (childActions.goChat) return childActions.goChat(st || status, draftText);
        await api("/workspace/init", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
        if (childActions.openBlank) await childActions.openBlank(st || status, { noPanel: true });
      }

      async function openTodoChat(it) {
        if (!status) return;
        const text = String((it && it.text) || "");
        const message = "我要补充待办「" + text + "」：请先等我回答，再记录并把这条待办勾掉。";
        try { if (childActions.askChat) await childActions.askChat(status, active, message); }
        catch (e) { showToast(String(e && e.message ? e.message : e)); }
      }

      async function openChat() {
        if (!status) return;
        const child = (status.children || []).find((c) => c.id === active) || (status.children || [])[0];
        childActions.activeId = active;
        try {
          await fetch(BASE + "/bootstrap", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ childId: active }),
          });
          if (childActions.openOrResume) await childActions.openOrResume(status, active);
          else if (childActions.open) await childActions.open(status, active);
        } catch (e) { showToast(String(e && e.message ? e.message : e)); }
      }

      if (!status) return h("div", { className: "cr-panel" }, h("div", { className: "cr-empty" }, "加载中…"));
      async function finishOnboard(r) {
        childActions.onboardingDismissed = true;
        childActions.forceOnboard = false;
        setForceOnboard(false);
        setShowOnboard(false);
        const child = r && (r.child || (r.children && r.children[0]));
        await refresh();
        if (child && child.id) {
          try {
            const st = await loadStatus();
            childActions.activeId = child.id;
            setActive(child.id);
            OVERVIEW_ETAGS.delete(child.id);
            const o = await loadOverview(child.id);
            if (o && o.ok && !o.notModified) setOverview(o);
            const target = (st.children || []).find((c) => c.id === child.id) || child;
            try {
              if (childActions.open) await childActions.open({ ...st, children: [...(st.children || []).filter((c) => c.id !== target.id), target] }, target.id);
              else if (childActions.openOrResume) await childActions.openOrResume(st, child.id);
            } catch {
              if (childActions.openOrResume) await childActions.openOrResume(st, child.id);
            }
          } catch { /* panel still refreshes */ }
        }
      }
      const boundChildId = currentSession ? readSessionChild(currentSession) : "";
      const sessionCwd = String(sessionInfo.cwd || "").replace(/\/+$/, "");
      const sessionBelongsToChild = !!(sessionCwd && children.some((c) => String(c.workspace || "").replace(/\/+$/, "") === sessionCwd));
      if (currentSession && !boundChildId && !sessionBelongsToChild && !forceOnboard && !family && children.length) {
        return h("div", { className: "cr-panel" },
          h("div", { className: "cr-panel-top" },
            h(Avatar, { child: null, size: 44 }),
            h("div", { className: "cr-who" }, h("div", { className: "cr-name-row" }, h("b", null, tr("问问"))), h("span", null, "这个对话还没有绑定档案")),
            h("div", { className: "cr-grow" })
          ),
          h("div", { className: "cr-card" },
            h("div", { className: "cr-sec", style: { marginTop: 0 } }, "先选一个孩子"),
            h("div", { className: "cr-mut", style: { lineHeight: 1.6 } }, "这个根会话不属于某个孩子。选档案会打开该孩子的独立会话，避免把别的孩子数据串进来。"),
            h("div", { className: "cr-entry-list", style: { marginTop: "8px" } }, children.map((c) => h("div", {
              key: c.id, className: "cr-entry-item", role: "button", tabIndex: 0,
              onClick: async () => { try { await childActions.openOrResume(status, c.id); } catch (e) { showToast(String(e && e.message ? e.message : e)); } },
            }, h(Avatar, { child: c, size: 36 }), h("span", { style: { flex: 1, textAlign: "left" } }, h("b", null, c.name), h("span", { className: "cr-mut" }, " · " + (c.ageShort || ""))), h("span", { className: "cr-entry-arrow" }, "→"))))
          )
        );
      }
      let child = children.find((c) => c.id === active) || children[0];
      if (pregnancyView && child) child = { ...child, stage: { key: "pregnancy", label: "孕期" }, ageText: "孕期档案", ageShort: "孕期档案", months: undefined, keyMetrics: [] };
      if (!child || forceOnboard) {
        if (!showOnboard && !forceOnboard) return h("div", { className: "cr-panel" },
          h("div", { className: "cr-panel-top" },
            h(Avatar, { child: null, size: 44 }),
            h("div", { className: "cr-who" },
              h("div", { className: "cr-name-row" }, h("b", null, tr("问问"))),
              h("span", null, "还没有孩子档案")
            ),
            h("div", { className: "cr-grow" }),
            h("button", { className: "cr-btn primary", onClick: () => { childActions.onboardingDismissed = false; setShowOnboard(true); } }, tr("创建新档案"))
          ),
          h("div", { className: "cr-card" },
            h("div", { className: "cr-sec", style: { marginTop: 0 } }, "空档案"),
            h("div", { className: "cr-empty" }, "右侧还没有可显示的档案。"),
            h("div", { className: "cr-mut", style: { lineHeight: 1.6 } }, "可以点「创建新档案」走表单，也可以直接在左边对话里说「帮我建一个孩子档案」。")
          )
        );
        return h("div", { className: "cr-panel" }, h(OnboardingCard, { status, onDone: finishOnboard, onMigrate: async () => {
        try { await openBlankChat(status, "我有以前散落在纸/微信/表格里的育儿记录，想迁移进档案。请先告诉我需要准备什么、按什么格式发给你。"); } catch (e) { showToast(String(e && e.message ? e.message : e)); }
      }, onCancel: () => { setForceOnboard(false); setShowOnboard(false); childActions.forceOnboard = false; }, onChat: async () => {
        try { await openBlankChat(status, "我想第一次用问问建档案。请先问我：孩子小名、生日或预产期、性别、国家/城市。"); } catch (e) { showToast(String(e && e.message ? e.message : e)); }
      } }));
      }
      const stageKey = (child.stage && child.stage.key) || "toddler";
      const pregnancyOnly = pregnancyView || stageKey === "pregnancy";
      const baseSections = pregnancyOnly ? ["pregnancy"] : (STAGE_SECTIONS[stageKey] || STAGE_SECTIONS.toddler);
      const sections = pregnancyOnly ? ["pregnancy"] : (showHistory ? Array.from(new Set([...baseSections, ...HISTORY_SECTIONS])) : baseSections);
      const actions = STAGE_ACTIONS[stageKey] || STAGE_ACTIONS.toddler;
      const isFree = stageKey === "preschool" || stageKey === "school";
      const show = (id) => sections.includes(id);
      const pages = [
        { key: "all", label: tr("全部"), full: "全部" },
        show("daily") ? { key: "daily", label: tr("日常"), full: "日常" } : null,
        show("expense") ? { key: "expense", label: tr("花费"), full: "育儿花费" } : null,
        (show("growth") || show("nutrition") || show("assessment")) ? { key: "growth", label: tr("生长"), full: "生长 / 营养 / 发育评估" } : null,
        (show("vaccine") || show("checkup")) ? { key: "vaccine", label: tr("疫苗"), full: "疫苗与体检" } : null,
        show("milestone") ? { key: "milestone", label: tr("里程"), full: "里程碑" } : null,
        (show("specialSupplement") || show("medication")) ? { key: "specialSupplement", label: tr("补剂"), full: "补剂与用药" } : null,
        show("pregnancy") ? { key: "pregnancy", label: tr("孕期"), full: "孕期" } : null,
        show("preconception") ? { key: "preconception", label: tr("备孕"), full: "备孕" } : null,
        show("free") ? { key: "free", label: tr("表单"), full: "自定义表单" } : null,
        (show("personality") || !isFree) ? { key: "guide", label: tr("阶段"), full: "人格 / 阶段 / 提醒" } : null,
      ].filter(Boolean);
      const onToday = page === "all";
      const pageIs = (key) => page === key || page === "all";
      const activeTab = page === "all" ? scrollActive : page;
      const switchPage = (key) => {
        setPage(key);
        if (key === "all") setScrollActive("all");
        try { const p = document.querySelector(".cr-panel"); if (p) p.scrollTop = 0; } catch { /* ignore */ }
      };
      const group = (title, ...nodes) => h("div", { className: "cr-group" }, h("div", { className: "cr-group-title" }, title), ...nodes);

      if (family) {
        if (showSummary) {
        return h("div", { className: "cr-panel", "data-session": currentSession || "" },
          h("div", { className: "cr-panel-top" },
            h(Avatar, { child, size: 46 }),
            h("div", { className: "cr-who" }, h("div", { className: "cr-name-row" }, h("b", null, maskName(child.name, status.privacyMode)), status.devMode ? h("span", { className: "cr-chip dev" }, "DEV") : null, child.stage ? h("span", { className: "cr-stage-chip" }, child.stage.label) : null), h("span", null, child.ageText)),
            h("div", { className: "cr-grow" }),
            h("button", { className: "cr-btn ghost", onClick: () => setShowSummary(false) }, "返回"),
            h("button", { className: "cr-btn ghost", onClick: refresh }, "刷新")
          ),
          h(SummaryDashboard, { overview, isFree, onAll: setAllKind, privacyMode: status.privacyMode }),
        h("div", { className: "cr-mut", style: { marginTop: "2px" } }, "内容仅供参考，不构成诊断/医疗建议；请自己判断，必要时问医生。"),
          toast ? h("div", { className: "cr-toast" }, toast) : null
        );
      }

      const liveKey = overview ? [
        overview.timeline && overview.timeline[0] && overview.timeline[0].text,
        overview.recordRows && overview.recordRows[0] && [overview.recordRows[0].date, overview.recordRows[0].milk, overview.recordRows[0].poop, overview.recordRows[0].water, overview.recordRows[0].food, overview.recordRows[0].supplement].join(","),
        overview.growthRows && overview.growthRows.length,
        overview.vaccineRows && overview.vaccineRows.length,
        overview.checkupRows && overview.checkupRows.length,
        overview.milestoneRows && overview.milestoneRows.length,
        overview.foodRows && overview.foodRows.length,
        overview.personality && overview.personality.length,
      ].join("|") : "empty";

      return h("div", { className: "cr-panel", "data-session": currentSession || "" },
          h("div", { className: "cr-panel-top" },
            h(Avatar, { child: null, size: 46 }),
            h("div", { className: "cr-who" }, h("div", { className: "cr-name-row" }, h("b", null, "全家"), status.devMode ? h("span", { className: "cr-chip dev" }, "DEV") : null), h("span", null, children.length + " 个孩子")),
            h("div", { className: "cr-grow" }),
            h("select", {
              className: "cr-btn", value: "__family__",
              onChange: (e) => { if (e.target.value !== "__family__") { setFamily(false); childActions.openOrResume(status, e.target.value).catch(() => { childActions.activeId = e.target.value; setActive(e.target.value); OVERVIEW_ETAGS.delete(e.target.value);
              loadOverview(e.target.value).then((o) => { if (o && o.ok && !o.notModified) setOverview(o); }); }); } },
            }, [h("option", { key: "__family__", value: "__family__" }, "全家")].concat(children.map((c) => h("option", { key: c.id, value: c.id }, maskName(c.name, status.privacyMode))))),
            h("button", { className: "cr-btn ghost", onClick: refresh }, "刷新")
          ),
          h(FamilyExpenseCard, { items: familyData }),
          h(FamilyPanel, { items: familyData, onOpen: (id) => {
            setFamily(false);
            childActions.activeId = id;
            setActive(id);
            OVERVIEW_ETAGS.delete(id);
            loadOverview(id).then((o) => { if (o && o.ok && !o.notModified) setOverview(o); });
          } }),
          h(ReminderPanel, { items: reminders, onDelete: removeReminder }),
          toast ? h("div", { className: "cr-toast" }, toast) : null
        );
      }

      if (showSummary) {
        return h("div", { className: "cr-panel", "data-session": currentSession || "" },
          h("div", { className: "cr-panel-top" },
            h(Avatar, { child, size: 46 }),
            h("div", { className: "cr-who" }, h("div", { className: "cr-name-row" }, h("b", null, maskName(child.name, status.privacyMode)), status.devMode ? h("span", { className: "cr-chip dev" }, "DEV") : null, child.stage ? h("span", { className: "cr-stage-chip" }, child.stage.label) : null), h("span", null, child.ageText)),
            h("div", { className: "cr-grow" }),
            h("button", { className: "cr-btn ghost", onClick: () => setShowSummary(false) }, "返回"),
            h("button", { className: "cr-btn ghost", onClick: refresh }, "刷新")
          ),
          h(SummaryDashboard, { overview, isFree, onAll: setAllKind, privacyMode: status.privacyMode }),
        h("div", { className: "cr-mut", style: { marginTop: "2px" } }, "内容仅供参考，不构成诊断/医疗建议；请自己判断，必要时问医生。"),
          toast ? h("div", { className: "cr-toast" }, toast) : null
        );
      }

      const liveKey = overview ? [
        overview.timeline && overview.timeline[0] && overview.timeline[0].text,
        overview.recordRows && overview.recordRows[0] && [overview.recordRows[0].date, overview.recordRows[0].milk, overview.recordRows[0].poop, overview.recordRows[0].water, overview.recordRows[0].food, overview.recordRows[0].supplement].join(","),
        overview.growthRows && overview.growthRows.length,
        overview.vaccineRows && overview.vaccineRows.length,
        overview.checkupRows && overview.checkupRows.length,
        overview.milestoneRows && overview.milestoneRows.length,
        overview.foodRows && overview.foodRows.length,
        overview.personality && overview.personality.length,
      ].join("|") : "empty";

      return h("div", { className: "cr-panel", "data-session": currentSession || "" },
        h("div", { className: "cr-panel-top" },
          h("button", { className: "cr-avatar-btn", title: "换头像", onClick: () => avatarInputRef.current && avatarInputRef.current.click() },
            h(Avatar, { child, size: 46 })
          ),
          h("input", { ref: avatarInputRef, type: "file", accept: "image/png,image/jpeg,image/webp", style: { display: "none" }, onChange: (e) => changeAvatar(e.target.files && e.target.files[0]) }),
          h("div", { className: "cr-who" }, h("div", { className: "cr-name-row" }, h("b", null, maskName(child.name, status.privacyMode)), status.devMode ? h("span", { className: "cr-chip dev" }, "DEV") : null, child.stage ? h("span", { className: "cr-stage-chip" }, child.stage.label) : null), h("span", null, child.ageText)),
          h("div", { className: "cr-grow" }),
          children.length ? h("select", {
            className: "cr-btn", title: "快速切换档案", value: pregnancyView ? "__pregnancy__" : (family ? "__family__" : active),
            onChange: (e) => {
              if (e.target.value === "__family__") { setPregnancyView(false); setFamily(true); setOverview(null); refresh(); return; }
              if (e.target.value === "__pregnancy__") {
                setPregPage("all"); setPage("all"); setScrollActive("all"); setPregnancyView(true);
                if (child.kind === "pregnancy") { setPregnancyReturnId(""); return; }
                const linked = child.pregnancyId ? children.find((c) => c.id === child.pregnancyId) : null;
                if (linked) {
                  setPregnancyReturnId(child.id);
                  childActions.activeId = linked.id;
                  setActive(linked.id);
                  OVERVIEW_ETAGS.delete(linked.id);
                  loadOverview(linked.id).then((o) => { if (o && o.ok && !o.notModified) setOverview(o); });
                } else {
                  setPregnancyReturnId("");
                }
                return;
              }
              setPregnancyView(false);
              setFamily(false);
              setShowHistory(false);
              setPage("all");
              setScrollActive("all");
              // 面板切换档案也必须切到该孩子自己的会话，避免“主对话是A、面板是B”。
              childActions.openOrResume(status, e.target.value).catch(() => {
                childActions.activeId = e.target.value;
                setActive(e.target.value);
                OVERVIEW_ETAGS.delete(e.target.value);
                loadOverview(e.target.value).then((o) => { if (o && o.ok && !o.notModified) setOverview(o); });
              });
            },
          }, [h("option", { key: "__family__", value: "__family__" }, "全家")].concat(children.map((c) => h("option", { key: c.id, value: c.id }, maskName(c.name, status.privacyMode)))).concat(stageKey !== "preconception" ? [h("option", { key: "__pregnancy__", value: "__pregnancy__" }, "孕期档案")] : [])) : null,
          (pregnancyView || pregnancyOnly) && child.kind === "pregnancy" && !child.born ? h("button", { className: "cr-btn primary", onClick: () => setBirthOpen(true) }, "宝宝出生了") : null,
          pregnancyView ? h("button", { className: "cr-btn ghost", onClick: () => {
            setPregnancyView(false);
            if (pregnancyReturnId) {
              const backId = pregnancyReturnId;
              setPregnancyReturnId("");
              childActions.activeId = backId;
              setActive(backId);
              OVERVIEW_ETAGS.delete(backId);
              loadOverview(backId).then((o) => { if (o && o.ok && !o.notModified) setOverview(o); });
            }
          } }, "返回孩子") : null,
          !pregnancyOnly ? h("button", { className: "cr-btn ghost", onClick: () => setShowSummary(true) }, "总汇总") : null,
          family ? null : h("button", { className: "cr-btn primary", onClick: openChat }, "开对话")
        ),
        (overview && overview.missing && overview.missing.length && !pregnancyOnly) ? h("div", { className: "cr-missing" },
          h("div", { style: { flex: 1, minWidth: 0 } },
            h("b", null, "档案还缺：" + overview.missing.join("、")),
            h("span", null, "补上后年龄、孕周和当地标准会更准。")
          ),
          h("button", { className: "cr-btn ghost", onClick: () => {
            const text = "我的档案还缺：" + overview.missing.join("、") + "。请一项一项问我，我回答后帮我补进档案。";
            if (childActions.draftComposer) { childActions.draftComposer(text); }
            try { document.querySelector('[contenteditable="true"]')?.focus(); } catch { /* ignore */ }
          } }, "在对话里补")
        ) : null,
        rootSession ? h("div", { className: "cr-root-bind" },
          h("div", { style: { flex: 1, minWidth: 0 } },
            h("b", null, "这个对话在总工作区根目录"),
            h("span", null, "不属于某个孩子。选择档案后，我会打开对应的孩子会话；这个根会话会留在历史里。")
          ),
          h("div", { className: "cr-metrics" },
            children.map((c) => h("button", { key: c.id, className: "cr-btn ghost", onClick: async () => {
              setRootDismissed(currentSession || "");
              setRootSession(false);
              try { await childActions.openOrResume(status, c.id); } catch (e) { showToast(String(e && e.message ? e.message : e)); }
            } }, c.name)),
            h("button", { className: "cr-btn ghost", onClick: () => { setRootDismissed(currentSession || ""); setRootSession(false); } }, "普通对话")
          )
        ) : null,
        (pregnancyView && child.kind === "child" && !child.pregnancyId) ? h("div", { className: "cr-mut", style: { lineHeight: 1.6, margin: "0 0 6px", color: "rgba(0,0,0,.58)" } }, "这个孩子还没有关联孕期档案；下面是空的孕期记录。关联/出生后再填写。") : null,
        pregnancyOnly ? h("div", { className: "cr-preg-tabs" },
          [["all", "全部"], ["edd", "预产期"], ["checkup", "产检"], ["vitals", "体重血压"], ["reports", "报告"], ["meds", "用药"], ["meals", "饮食"], ["bag", "待产包"]].map(([key, label]) => h("button", { key, className: "cr-pill " + (pregPage === key ? "on" : ""), onClick: () => setPregPage(key) }, label))
        ) : h(JumpBar, { items: pages, active: activeTab, onPick: (key) => { if (key === "pregnancy") setPregnancyView(true); else switchPage(key); } }),
        onToday && !pregnancyOnly ? h(RecentUpdates, { key: liveKey, overview, pending: overview && overview.pending, onConfirm: confirmPendingItem, onCancel: cancelPendingItem, estimate, onEstimateConfirm: () => resolveEstimate("confirm"), onEstimateDelete: () => resolveEstimate("delete") }) : null,
        onToday && !family && !pregnancyOnly ? h(KeyMetricsCard, { overview, child, onSaved: refresh }) : null,
        onToday && !pregnancyOnly ? h("div", { className: "cr-live-grid" },
          h(TodoCard, { overview, onAdd: () => setForm("todo"), onFill: (it) => setFillTodo(it), onChat: (it) => openTodoChat(it), onDone: async (text) => {
            const r = await postWrite(active, "todo", { text }).catch(() => null);
            showToast(r && r.ok ? "已完成" : ((r && r.error) || "标记失败"));
            await refresh();
          } }),
          h(TimeNotesCard, { overview, onCarryOver: carryOverItem })
        ) : null,
        onToday ? h(QuickActions, { actions: (() => {
          const order = QUICK_PRIORITY[stageKey] || [];
          const rank = (id) => { const i = order.indexOf(id); return i < 0 ? 999 : i; };
          return [...actions].sort((a, b) => rank(a) - rank(b));
        })(), onForm: setForm, onRefresh: refresh }) : null,
        onToday && (show("daily") || show("specialSupplement") || show("medication")) ? h(TodayPlanCard, { overview, onRemind: makeReminder }) : null,
        page === "all" && !pregnancyOnly ? (isFree ? h("div", { className: "cr-mode" },
          h("button", { className: "cr-pill " + (showHistory ? "on" : ""), onClick: () => setShowHistory(!showHistory) }, showHistory ? "回到自由模式" : "看历史记录")
        ) : (show("growth") || show("daily") || show("nutrition") || show("vaccine") || show("checkup") || show("milestone") || show("specialSupplement") || show("medication") || show("assessment") || show("preconception") || show("pregnancy") || showHistory) ? h("div", { className: "cr-mode" },
          h("button", { className: "cr-pill " + (viewMode === "sections" ? "on" : ""), onClick: () => setViewMode("sections") }, "分类表"),
          h("button", { className: "cr-pill " + (viewMode === "all" ? "on" : ""), onClick: () => setViewMode("all") }, "全部数据表"),
          h("button", { className: "cr-pill " + (showHistory ? "on" : ""), onClick: () => setShowHistory(!showHistory) }, showHistory ? "回到当前阶段" : "看历史")
        ) : null) : null,
        page === "all" && showHistory ? h("div", { className: "cr-mut", style: { margin: "0 0 8px" } }, "正在看全部历史；当前阶段是「" + (child.stage ? child.stage.label : "未知") + "」。") : null,
        page === "all" && viewMode === "all" ? h(CombinedPanel, { overview }) : h("div", null,
          pageIs("daily") && show("daily") ? group("日常记录", h(DailyTablePanel, { overview, onForm: setForm, onAll: setAllKind })) : null,
          pageIs("daily") && show("daily") ? group("睡眠", h(SleepPanel, { overview, onForm: setForm, onAll: setAllKind })) : null,
          pageIs("expense") && show("expense") ? group("育儿花费", h(ExpensePanel, { overview, onForm: setForm, onAll: setAllKind, onSaveEstimate: saveExpenseEstimate })) : null,
          pageIs("growth") && show("growth") ? group("生长曲线", h(GrowthPanel, { overview, onForm: setForm, onAll: setAllKind })) : null,
          pageIs("growth") && show("nutrition") ? group("营养与喂养", h(NutritionPanel, { overview, onAll: setAllKind })) : null,
          pageIs("vaccine") && show("vaccine") ? group("疫苗对照", h(VaccinePanel, { overview, onForm: setForm, onAll: setAllKind })) : null,
          pageIs("vaccine") && show("checkup") ? group("体检记录", h(CheckupPanel, { overview, onForm: setForm, onAll: setAllKind })) : null,
          pageIs("milestone") && show("milestone") ? group("里程碑", h(MilestonePanel, { overview, onForm: setForm, onAll: setAllKind })) : null,
          pageIs("specialSupplement") && show("specialSupplement") ? group("特殊补剂", h(SpecialSupplementPanel, { overview, onForm: setForm, onAll: setAllKind })) : null,
          pageIs("specialSupplement") && show("medication") ? group("用药记录", h(MedicationPanel, { overview, onForm: setForm, onAll: setAllKind })) : null,
          pageIs("growth") && show("assessment") ? group("发育评估", h(AssessmentPanel, { overview, onForm: setForm, onAll: setAllKind, onSave: async (payload) => {
            const r = await postWrite(active, "assessment", payload).catch(() => null);
            showToast(r && r.ok ? "评估已记下" : ((r && r.error) || "保存失败"));
            await refresh();
            return r;
          } })) : null,
          pageIs("pregnancy") && show("pregnancy") ? group("孕期", h(PregnancyPanel, { overview, section: pregPage, onRemind: makePregnancyReminder, onForm: setForm, onAll: setAllKind, onToggleBag: toggleBagItem, onEdd: () => setEddOpen(true) })) : null,
          pageIs("preconception") && show("preconception") ? group("备孕", h(PreconceptionPanel, { overview, onAll: setAllKind })) : null,
          pageIs("free") && show("free") ? group("自定义表单", h(FreePanel, { overview, onNew: () => setFreeNew(true), onRecord: (f) => setFreeForm(f), onView: (f) => setFreeRecords(f) })) : null,
          pageIs("guide") && show("personality") ? group("人格与偏好", h(PersonalityPanel, { overview, onAll: setAllKind })) : null,
          pageIs("guide") ? group("阶段参照",
            pageIs("guide") && show("stage") ? h(StagePanel, { child }) : null,
            !isFree && overview && overview.stageGuide && overview.stageGuide.items.length ? h(StageGuideCard, { guide: overview.stageGuide, onAll: () => setShowGuide(true) }) : null
          ) : null,
          pageIs("guide") ? group("到点提醒",
            !isFree && (show("growth") || show("assessment") || show("pregnancy") || show("vaccine")) ? h(AgeReminderCard, { overview, onForm: setForm, onScroll: (id) => {
              try { const el = document.getElementById(id); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" }); } catch { /* ignore */ }
            } }) : null,
            h(ReminderPanel, { items: reminders, onDelete: removeReminder })
          ) : null
        ),
        !isFree && !pregnancyOnly ? h(CustomSummaryPanel, { forms: overview && overview.customForms }) : null,
        h("div", { className: "cr-mut", style: { marginTop: "2px" } }, "内容仅供参考，不构成诊断/医疗建议；请自己判断，必要时问医生。"),
        eddOpen ? h(EddModal, { child, onClose: () => setEddOpen(false), onSaved: async (r) => { if (r && r.warning) showToast(r.warning); await refresh(); } }) : null,
        birthOpen ? h(BirthModal, { pregnancy: child, onClose: () => setBirthOpen(false), onSaved: async (r) => { setBirthOpen(false); setPregnancyView(false); await refresh(); try { const st = await loadStatus(); const first = r && r.children && r.children[0]; if (first && childActions.openOrResume) await childActions.openOrResume(st, first.id); } catch { /* ignore */ } } }) : null,
        fillTodo ? h(TodoFillModal, { item: fillTodo, onClose: () => setFillTodo(null), busy, onSave: (answer) => answerTodoItem(fillTodo, answer), onChat: async (text) => { setFillTodo(null); await openTodoChat({ text }); } }) : null,
        form ? h(FormModal, { type: form, onClose: () => setForm(null), onSubmit: submit, busy, devMode: !!(status && status.devMode) }) : null,
        freeNew ? h(NewFormModal, { onClose: () => setFreeNew(false), onCreate: async (payload) => {
          const r = await createCustomForm(active, payload).catch(() => null);
          showToast(r && r.ok ? "表单已创建" : ((r && r.error) || "创建失败"));
          await refresh();
          return r;
        } }) : null,
        freeForm ? h(CustomFormModal, { form: freeForm, onClose: () => setFreeForm(null), onSave: async (f, values) => {
          const r = await postCustomRecord(active, f.id, values).catch(() => null);
          showToast(r && r.ok ? "已记下" : ((r && r.error) || "保存失败"));
          await refresh();
          return r;
        } }) : null,
        freeRecords ? h(CustomRecordsModal, { form: freeRecords, onClose: () => setFreeRecords(null), load: (formId) => customRecords(active, formId) }) : null,
        allKind ? h(AllRecordsModal, { kind: allKind, childId: active, onClose: () => setAllKind(null), load: (k) => api("/records?child=" + encodeURIComponent(active) + "&kind=" + encodeURIComponent(k)) }) : null,
        showGuide && overview && overview.stageGuide ? h(StageGuideModal, { guide: overview.stageGuide, onClose: () => setShowGuide(false) }) : null,
        toast ? h("div", { className: "cr-toast" }, toast) : null
      );
    }

    const STAGE_DETAILS = {
      preconception: ["刚开始准备", "已经准备一段时间"],
      pregnancy: ["孕早期（0–13 周）", "孕中期（14–27 周）", "孕晚期（28 周+）"],
      newborn: ["0–3 月", "4–6 月", "7–12 月"],
      toddler: ["1–2 岁", "2–3 岁"],
      preschool: ["3–4 岁", "4–5 岁", "5–6 岁"],
      school: ["6–9 岁", "9–12 岁"],
    };
    const detailsOf = (stage) => STAGE_DETAILS[stage] || [];

    const ONBOARD_STAGES = [
      { key: "preconception", label: "备孕", desc: "还没怀上", icon: "备" },
      { key: "pregnancy", label: "孕期", desc: "已经怀孕", icon: "孕" },
      { key: "newborn", label: "0–1 岁", desc: "新生儿/婴儿", icon: "婴" },
      { key: "toddler", label: "1–3 岁", desc: "幼儿", icon: "幼" },
      { key: "preschool", label: "3–6 岁", desc: "幼儿园", icon: "园" },
      { key: "school", label: "6 岁+", desc: "小学以后", icon: "学" },
    ];

    function OnboardingCard({ status, onDone, onChat, onMigrate, onCancel }) {
      const [step, setStep] = useState(0);
      const [stage, setStage] = useState("toddler");
      const [stageDetail, setStageDetail] = useState(detailsOf("toddler")[0]);
      const [form, setForm] = useState({ name: "", birthDate: "", sex: "", dueDate: "", workspace: "", userName: "", userRole: "妈妈", motherName: "", country: "中国", city: "" });
      const [busy, setBusy] = useState(false);
      const [privacyOk, setPrivacyOk] = useState(false);
      const [refOk, setRefOk] = useState(false);
      const [err, setErr] = useState("");
      const [created, setCreated] = useState(null);
      const needBirth = !["preconception", "pregnancy"].includes(stage);
      const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
      const stageInfo = ONBOARD_STAGES.find((x) => x.key === stage) || ONBOARD_STAGES[3];
      async function submit() {
        if (!form.name.trim()) { setErr("先填个小名"); return; }
        if (needBirth && !form.birthDate) { setErr("请填生日，用来算月龄和阶段"); return; }
        if (stage === "pregnancy" && !form.dueDate) { setErr("孕期请填预产期，用来算孕周"); return; }
        if (!form.country.trim()) { setErr("请填国家/地区，用于匹配当地标准"); return; }
        setBusy(true); setErr("");
        const r = await api("/onboard", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...form, stage, stageDetail, workspace: form.workspace || status.workspace }),
        }).catch((e) => ({ ok: false, error: String(e && e.message ? e.message : e) }));
        setBusy(false);
        if (!r.ok) { setErr(r.error || "创建失败"); return; }
        setCreated(r);
        setStep(2);
      }
      return h("div", { className: "cr-card cr-onboard" },
        h("div", { className: "cr-onboard-hero" },
          h(Avatar, { child: null, size: 46 }),
          h("div", { style: { flex: 1 } },
            h("div", { className: "cr-onboard-kicker" }, "第一次使用 · 3 步"),
            h("h2", null, "先给一个孩子建档案"),
            h("p", null, "不用填很多。名字 + 生日（孕期填预产期）就能开始；其他以后慢慢补。")
          ),
          onCancel ? h("button", { className: "cr-btn ghost cr-onboard-cancel", onClick: onCancel }, "返回") : null
        ),
        h("div", { className: "cr-privacy-note" },
          h("b", null, "开始前先知道两件事"),
          h("div", null, "· 隐私：档案写在本机工作区；报告图只在当轮给模型看，不存原图；姓名/证件/电话/地址/就诊号不转录。"),
          h("div", null, "· 参考：本功能仅做记录、整理、提醒和参考，不做诊断；AI 内容可能有误，请自行判断，医疗问题咨询医生。"),
          h("div", { className: "cr-mut", style: { marginTop: "4px" } }, "DSH/模型会处理当轮对话和上传图；敏感内容可以先遮住再发；角色只是称呼，档案始终按孩子建。"),
          h("label", { className: "cr-consent" }, h("input", { type: "checkbox", checked: privacyOk, onChange: (e) => setPrivacyOk(e.target.checked) }), "我已了解隐私提醒，继续"),
          h("label", { className: "cr-consent" }, h("input", { type: "checkbox", checked: refOk, onChange: (e) => setRefOk(e.target.checked) }), "我知道 AI 内容仅供参考，会自己判断")
        ),
        h("div", { className: "cr-steps" }, [1, 2, 3].map((n) => h("span", { key: n, className: "cr-step " + (step >= n - 1 ? "on" : "") }, n))),
        step === 0 ? h("div", null,
          h("div", { className: "cr-sec" }, "现在是哪个阶段？"),
          h("div", { className: "cr-onboard-grid" }, ONBOARD_STAGES.map((x) => h("button", {
            key: x.key, className: "cr-onboard-option " + (stage === x.key ? "on" : ""), onClick: () => { setStage(x.key); setStageDetail(detailsOf(x.key)[0] || ""); },
          }, h("span", { className: "cr-onboard-icon" }, x.icon), h("b", null, x.label), h("span", null, x.desc)))),
          h("div", { className: "cr-field", style: { marginTop: "10px" } }, h("label", null, "具体到哪个阶段（最好选一下）"),
            h("select", { value: stageDetail, onChange: (e) => setStageDetail(e.target.value) },
              detailsOf(stage).map((x) => h("option", { key: x, value: x }, x)))),
          h("div", { className: "cr-field" }, h("label", null, "国家 / 地区"), h("input", { value: form.country, placeholder: "中国 / 美国 / 日本", onChange: (e) => set("country", e.target.value) })),
          h("div", { className: "cr-field" }, h("label", null, "城市（用于当地标准）"), h("input", { value: form.city, placeholder: "上海 / 东京", onChange: (e) => set("city", e.target.value) })),
          h("div", { className: "cr-metrics", style: { marginTop: "12px" } },
            h("button", { className: "cr-btn primary", style: { flex: 1 }, disabled: !(privacyOk && refOk), onClick: () => {
              if (!(privacyOk && refOk)) return;
              if (!form.country.trim()) { setErr("请填国家/地区，用于匹配当地标准"); return; }
              if (stageDetail === undefined || stageDetail === "") setStageDetail(detailsOf(stage)[0]);
              setStep(1);
            } }, privacyOk && refOk ? "自己填资料" : "先勾选两条提醒"),
            onChat ? h("button", { className: "cr-btn", style: { flex: 1 }, disabled: !(privacyOk && refOk), onClick: () => { if (privacyOk && refOk) onChat(); } }, "去聊天里说") : null,
            onMigrate ? h("button", { className: "cr-btn", style: { flex: 1 }, disabled: !(privacyOk && refOk), onClick: () => { if (privacyOk && refOk) onMigrate(); } }, "已有数据迁移") : null
          )
        ) : null,
        step === 1 ? h("div", null,
          h("div", { className: "cr-sec" }, "基本信息"),
          h("div", { className: "cr-field" }, h("label", null, "使用者是谁（昵称）"), h("input", { value: form.userName, placeholder: "小满 / 妈妈", onChange: (e) => set("userName", e.target.value) })),
          h("div", { className: "cr-field" }, h("label", null, "角色"), h("select", { value: form.userRole, onChange: (e) => set("userRole", e.target.value) }, ["妈妈", "爸爸", "外婆", "外公", "奶奶", "爷爷", "医生", "其他"].map((x) => h("option", { key: x, value: x }, x)))),
          h("div", { className: "cr-field" }, h("label", null, stage === "pregnancy" ? "孕期的妈妈昵称" : "孕期妈妈昵称（如果适用）"), h("input", { value: form.motherName, placeholder: "小满", onChange: (e) => set("motherName", e.target.value) })),
          h("div", { className: "cr-mut", style: { marginTop: "-4px", marginBottom: "8px" } }, "角色仅用于称呼；档案始终按孩子建立。"),
          h("div", { className: "cr-field" }, h("label", null, "孩子小名"), h("input", { value: form.name, placeholder: "宝宝", onChange: (e) => set("name", e.target.value) })),
          h("div", { className: "cr-field" }, h("label", null, "具体阶段"), h("input", { value: stageDetail, readOnly: true })),
          h("div", { className: "cr-field" }, h("label", null, needBirth ? "生日" : "生日（备孕/孕期可不填）"), h("input", { type: "date", value: form.birthDate, onChange: (e) => set("birthDate", e.target.value) })),
          stage === "pregnancy" ? h("div", { className: "cr-field" }, h("label", null, "预产期"), h("input", { type: "date", value: form.dueDate, onChange: (e) => set("dueDate", e.target.value) })) : null,
          h("div", { className: "cr-field" }, h("label", null, "性别（可不填）"), h("input", { value: form.sex, placeholder: "女 / 男", onChange: (e) => set("sex", e.target.value) })),
          h("div", { className: "cr-mut", style: { marginBottom: "8px", lineHeight: 1.6 } }, "系统将为每个孩子建立独立档案目录，各自独立保存。"),
          err ? h("div", { className: "cr-mut", style: { color: "#D24B36" } }, err) : null,
          h("div", { className: "cr-metrics", style: { marginTop: "10px" } },
            h("button", { className: "cr-btn", onClick: () => setStep(0) }, "上一步"),
            onChat ? h("button", { className: "cr-btn", disabled: !(privacyOk && refOk), onClick: () => { if (privacyOk && refOk) onChat(); } }, "去聊天里说") : null,
            h("button", { className: "cr-btn primary", disabled: busy || !(privacyOk && refOk), onClick: submit }, busy ? "建档中…" : privacyOk && refOk ? "建档案，开始" : "先勾选两条提醒")
          )
        ) : null,
        step === 2 ? h("div", { className: "cr-onboard-done" },
          h("div", { className: "cr-onboard-check" }, "✓"),
          h("h3", null, form.name + " 的档案建好了"),
          h("p", { className: "cr-mut" }, (form.userRole || "") + (form.userName ? " · " + form.userName : "") + (stageDetail ? " · " + stageDetail : "")),
          h("p", { className: "cr-mut" }, "接下来可以直接在对话框里说「今天喝了 600ml 奶」「第一次自己穿鞋」；也可以点快捷卡。"),
          h("button", { className: "cr-btn primary", onClick: () => onDone && onDone(created) }, "进入问问")
        ) : null,
        h("div", { className: "cr-mut", style: { marginTop: "10px" } }, "仅保存录入的档案与记录；原图、身份证/电话等信息不写入。")
      );
    }

    function apply(ctx) {
      installClientLocale(ctx);
      pluginCtx = ctx;
      const slots = pluginCtx.get("slots");
      if (!slots) { console.warn("[child-raise] no slots"); return; }
      widenPanel = (px) => {
        try {
          const layout = pluginCtx.get("layout");
          if (layout && layout.panels && typeof layout.panels.setRightbar === "function") layout.panels.setRightbar(px);
        } catch { /* optional */ }
      };
      childActions.cleanupWorkspaceEntries = async () => cleanupWorkspaces();
      childActions.openPanel = () => {
        try {
          const sr = pluginCtx.get("sidebarRight");
          if (sr && typeof sr.openTab === "function") sr.openTab(PANEL_ID);
          if (sr && typeof sr.expand === "function") sr.expand();
        } catch { /* ignore */ }
      };
      childActions.open = async (status, childId) => {
        const sessions = pluginCtx.get("sessions");
        const workspaces = pluginCtx.get("workspaces");
        const uiWorkspace = pluginCtx.get("uiWorkspace");
        if (!sessions || !uiWorkspace) throw new Error("会话服务还没就绪");
        const child = (status.children || []).find((c) => c.id === childId) || (status.children || [])[0];
        const workspace = (child && child.workspace) || status.workspace;
        notifyActiveChild(childId);
        // 旧档案可能只有配置、目录已丢；先让 host 补目录，再注册 workspace。
        try { await fetch(BASE + "/workspace/ensure", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId }) }); } catch { /* ignore */ }
        let workspaceId;
        if (workspaces && typeof workspaces.create === "function") {
          // 左栏的“档案子工作区”入口：目录仍挂在 child-doc 下，
          // 但 DSH 需要 workspace 才能在左侧显示可点击的档案入口。
          const view = await workspaces.create({ path: workspace });
          workspaceId = view.workspaceId;
        }
        const sid = await sessions.create({ workspaceId, cwd: workspace });
        childActions.sessions.add(sid);
        bindSessionChild(sid, childId);
        try {
          const ref = sessions.retain(sid, { source: "childRaise" });
          const binding = await ref.ready;
          try { await binding.session.rename((child && child.name ? child.name : "孩子") + " · 育儿"); } catch { /* title is a marker */ }
          ref.release();
        } catch { /* rename is best-effort */ }
        uiWorkspace.openSession(sid);
        setTimeout(() => {
          try {
            const sr = pluginCtx.get("sidebarRight");
            if (sr && typeof sr.openTab === "function") sr.openTab(PANEL_ID);
            if (sr && typeof sr.expand === "function") sr.expand();
          } catch { /* ignore */ }
        }, 700);
        return sid;
      };
      childActions.openBlank = async (status, opts = {}) => {
        const sessions = pluginCtx.get("sessions");
        const workspaces = pluginCtx.get("workspaces");
        const uiWorkspace = pluginCtx.get("uiWorkspace");
        if (!sessions || !uiWorkspace) throw new Error("会话服务还没就绪");
        const workspace = (status && status.workspace) || "";
        try { await fetch(BASE + "/workspace/init", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }); } catch { /* ignore */ }
        let workspaceId;
        if (workspaces && typeof workspaces.create === "function") {
          const view = await workspaces.create({ path: (status && status.workspace) || workspace });
          workspaceId = view.workspaceId;
        }
        const sid = await sessions.create({ workspaceId, cwd: workspace });
        childActions.sessions.add(sid);
        uiWorkspace.openSession(sid);
        if (!opts.noPanel) {
          setTimeout(() => {
            try {
              const sr = pluginCtx.get("sidebarRight");
              if (sr && typeof sr.openTab === "function") sr.openTab(PANEL_ID);
              if (sr && typeof sr.expand === "function") sr.expand();
            } catch { /* ignore */ }
          }, 700);
        }
        return sid;
      };

      childActions.draftComposer = (text) => {
        const el = document.querySelector('[contenteditable="true"]');
        if (!el || !text) return false;
        try {
          el.focus();
          const sel = window.getSelection();
          if (sel) {
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
          document.execCommand("insertText", false, String(text));
          el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: String(text) }));
          return true;
        } catch {
          try {
            el.textContent = String(text);
            el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: String(text) }));
            return true;
          } catch { return false; }
        }
      };

      childActions.goChat = async (status, draftText) => {
        childActions.onboardingDismissed = true;
        setOnboardDismissed((status && status.workspace) || pluginWorkspace, true);
        try { window.dispatchEvent(new Event("cr-onboarding-dismissed")); } catch { /* ignore */ }
        const existing = document.querySelector("[data-conversation-content]");
        if (existing) {
          setTimeout(() => { try { document.querySelector('[contenteditable="true"]')?.focus(); childActions.draftComposer(draftText); } catch { /* ignore */ } }, 300);
          return "existing";
        }
        const sid = await childActions.openBlank(status, { noPanel: true });
        setTimeout(() => {
          try { document.querySelector('[contenteditable="true"]')?.focus(); childActions.draftComposer(draftText); } catch { /* ignore */ }
        }, 450);
        return sid;
      };

      childActions.openOrResume = async (status, childId) => {
        const sessions = pluginCtx.get("sessions");
        const uiWorkspace = pluginCtx.get("uiWorkspace");
        const child = (status.children || []).find((c) => c.id === childId) || (status.children || [])[0];
        const workspace = (child && child.workspace) || status.workspace;
        try {
          const snapshot = sessions && sessions.list && sessions.list.getSnapshot ? sessions.list.getSnapshot() : null;
          const rows = snapshot && snapshot.byId ? Object.entries(snapshot.byId).map(([id, row]) => ({ id, ...(row || {}) })) : [];
          const hit = rows.filter((r) => (r.cwd === workspace || r.workspacePath === workspace) && r.id)
            .sort((a, b) => Number(b.updatedAt || b.lastActiveAt || b.createdAt || 0) - Number(a.updatedAt || a.lastActiveAt || a.createdAt || 0))[0];
          if (hit) {
            bindSessionChild(hit.id, childId);
            notifyActiveChild(childId);
            childActions.sessions.add(hit.id);
            uiWorkspace.openSession(hit.id);
            setTimeout(() => {
              try {
                const sr = pluginCtx.get("sidebarRight");
                if (sr && typeof sr.openTab === "function") sr.openTab(PANEL_ID);
                if (sr && typeof sr.expand === "function") sr.expand();
              } catch { /* ignore */ }
            }, 500);
            return { ok: true, reused: true, sessionId: hit.id };
          }
        } catch { /* fall through to create */ }
        await childActions.open(status, childId);
        return { ok: true, reused: false };
      };

      childActions.sendPrompt = async (message) => {
        const text = String(message || "").trim();
        if (!text) return false;
        try {
          const conv = pluginCtx.get("conversation");
          if (conv && typeof conv.send === "function") { await conv.send(text); return true; }
        } catch { /* fall through */ }
        try {
          const el = document.querySelector('[contenteditable="true"]');
          if (el) { el.focus(); document.execCommand("insertText", false, text); return true; }
        } catch { /* ignore */ }
        return false;
      };

      childActions.askChat = async (status, childId, message) => {
        const sessions = pluginCtx.get("sessions");
        const workspaces = pluginCtx.get("workspaces");
        const uiWorkspace = pluginCtx.get("uiWorkspace");
        if (!sessions || !uiWorkspace) throw new Error("会话服务还没就绪");
        const child = (status.children || []).find((c) => c.id === childId) || (status.children || [])[0];
        const workspace = (child && child.workspace) || status.workspace;
        let workspaceId;
        if (workspaces && typeof workspaces.create === "function") {
          const view = await workspaces.create({ path: workspace });
          workspaceId = view.workspaceId;
        }
        const sid = await sessions.create({ workspaceId, cwd: workspace });
        childActions.sessions.add(sid);
        uiWorkspace.openSession(sid);
        setTimeout(async () => {
          try {
            const conv = pluginCtx.get("conversation");
            if (conv && typeof conv.send === "function") { await conv.send(message); return; }
          } catch { /* fall through */ }
          try { const el = document.querySelector('[contenteditable="true"]'); if (el) { el.focus(); document.execCommand("insertText", false, message); } } catch { /* ignore */ }
        }, 900);
        return sid;
      };

      childActions.onboardChat = async (status, message) => {
        const sessions = pluginCtx.get("sessions");
        const workspaces = pluginCtx.get("workspaces");
        const uiWorkspace = pluginCtx.get("uiWorkspace");
        if (!sessions || !uiWorkspace) throw new Error("会话服务还没就绪");
        const workspace = (status && status.workspace) || "";
        try { await fetch(BASE + "/workspace/init", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }); } catch { /* ignore */ }
        let workspaceId;
        if (workspaces && typeof workspaces.create === "function") {
          const view = await workspaces.create({ path: (status && status.workspace) || workspace });
          workspaceId = view.workspaceId;
        }
        const sid = await sessions.create({ workspaceId, cwd: workspace });
        childActions.sessions.add(sid);
        uiWorkspace.openSession(sid);
        setTimeout(async () => {
          try {
            const conv = pluginCtx.get("conversation");
            if (conv && typeof conv.send === "function") { await conv.send(message); return; }
          } catch { /* fall through */ }
          try {
            const el = document.querySelector('[contenteditable="true"]');
            if (el) { el.focus(); document.execCommand("insertText", false, message); }
          } catch { /* ignore */ }
        }, 800);
        return sid;
      };

      childActions.launch = async () => {
        if (childActions.launching) return;
        childActions.launching = true;
        try {
          const s = await loadStatus();
          if (!s || !s.children || !s.children[0]) {
            try {
              const sr = pluginCtx.get("sidebarRight");
              if (sr && typeof sr.openTab === "function") sr.openTab(PANEL_ID);
              if (sr && typeof sr.expand === "function") sr.expand();
            } catch { /* ignore */ }
            try {
              await fetch(BASE + "/workspace/init", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
              await childActions.openBlank(s);
            } catch (e) { console.warn("[child-raise] open blank session failed", e); }
            return { ok: false, needOnboard: true };
          }
          try {
            await fetch(BASE + "/bootstrap", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ childId: s.children[0].id }),
            });
          } catch { /* bootstrap best-effort */ }
          await childActions.openOrResume(s, s.children[0].id);
          return { ok: true };
        } catch (e) {
          console.warn("[child-raise] launch failed", e);
          return { ok: false, error: String(e && e.message ? e.message : e) };
        } finally {
          childActions.launching = false;
        }
      };
      childActions.isChild = (sid, workspace) => {
        try {
          if (childActions.sessions.has(sid)) return true;
          const sessions = pluginCtx.get("sessions");
          const snapshot = sessions && sessions.list ? sessions.list.getSnapshot() : undefined;
          const row = snapshot && snapshot.byId ? snapshot.byId[sid] : undefined;
          return !!(row && row.cwd === workspace);
        } catch { return false; }
      };
      ctx.inject(["sidebarRightTabs"], (scope) => {
        const tabs = scope.sidebarRightTabs;
        if (!tabs || typeof tabs.register !== "function") return;
        ctx.effect(() => tabs.register({
          id: PANEL_ID,
          kind: PANEL_ID,
          title: () => tr("问问"),
          guide: [{ order: 30, title: () => tr("问问"), description: () => "待办 / 最近更新 / 生长曲线" }],
        }), "child-raise.right-tab");
        slots.inject("sidebar.right.pane.tab", () => slots.register({
          name: "sidebar.right.pane.tab", key: PANEL_ID,
        }, RightPanel));
      });
      slots.inject("sidebar.panellist", () => slots.register({
        name: "sidebar.panellist", id: PANEL_ID, order: 60, label: () => tr("问问"),
      }, SidebarIcon));
      slots.inject("main", () => slots.register({
        name: "main", key: PANEL_ID, label: () => tr("问问"),
      }, Launcher));
    }

    // 启动时把已有档案子目录注册为左栏入口（DSH workspace 分组），
    // 不依赖用户先打开右侧面板。
    try {
      loadStatus().then((s) => {
        const workspaces = pluginCtx.get("workspaces");
        if (!workspaces || typeof workspaces.create !== "function" || !s || !s.children) return;
        const valid = new Set();
        for (const c of s.children) {
          const path = String(c.workspace || "");
          if (path && path !== String(s.workspace || "")) {
            valid.add(path);
            fetch(BASE + "/workspace/ensure", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId: c.id }) })
              .then(() => workspaces.create({ path })).catch(() => {});
          }
        }
        childActions.cleanupWorkspaceEntries().catch(() => {});
        repairSessions().then(cleanupWorkspaces);
      }).catch(() => {});
    } catch { /* optional */ }

    exports.inject = ["slots"];
    exports.apply = apply;
    return module.exports;
  }
});
