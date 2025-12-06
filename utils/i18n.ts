
import { Language } from '../types';

export const TEXT = {
  en: {
    appTitle: "Paper Cut Art",
    step_fold: "fold",
    step_cut: "cut",
    
    // Controls
    tools: "Tools",
    undo: "Undo",
    redo: "Redo",
    thickness: "Line Thickness",
    startOver: "Start Over",
    download: "Download",
    savePattern: "Save Pattern",
    saveResult: "Save Result",
    
    // Folding
    freeFold: "Free Fold",
    presetPatterns: "Preset Patterns",
    resetPaper: "Reset Paper",
    startCutting: "Start Cutting",
    fold_TL: "Top-Left",
    fold_UP: "Up",
    fold_TR: "Top-Right",
    fold_LEFT: "Left",
    fold_RIGHT: "Right",
    fold_BL: "Bottom-Left",
    fold_DOWN: "Down",
    fold_BR: "Bottom-Right",
    changeColor: "Change Paper Color",
    
    // Hints
    hint_fold: "Choose a direction to fold the paper.",
    hint_cut: "Now you can start drawing/cutting.",
    
    // Interactive Guides - FOLD
    guide_fold_up: "1. Fold Up",
    guide_fold_up_sub: "Click to fold upwards",
    guide_fold_right: "2. Fold Right",
    guide_fold_right_sub: "Next, fold to the right",
    guide_fold_br: "3. Fold Corner",
    guide_fold_br_sub: "Fold the Bottom-Right corner",
    guide_fold_finish: "4. Start Cutting",
    guide_fold_finish_sub: "Click here to enter Cut Mode",

    // Interactive Guides - CUT
    guide_cut_tool: "Brush Tool",
    guide_cut_tool_sub: "Currently using Freehand Brush",
    guide_cut_canvas: "Draw Here",
    guide_cut_canvas_sub: "Draw lines to cut the paper",
    guide_cut_preview: "Real-time Result",
    guide_cut_preview_sub: "See the unfolded pattern here",
    guide_cut_save: "Save Work",
    guide_cut_save_sub: "Download your masterpiece",

    // Settings Sidebar
    settingsTitle: "Settings",
    tab_tutorial: "Tutorial",
    tab_gallery: "My Saves",
    tab_theme: "Appearance",
    tab_feedback: "Feedback",
    tab_about: "About Us",
    
    // Settings Content
    mySavedWorks: "My Saved Works",
    noSaves: "No saved works yet. Create and download something!",
    deleteConfirm: "Delete this saved work?",
    
    dynamicTheme: "Dynamic Icon Colors",
    dynamicThemeDesc: "Change interface buttons to match your selected paper color",
    
    yourSuggestion: "Your Suggestion",
    placeholderFeedback: "Tell us what you think...",
    uploadScreenshot: "Upload Screenshot (Optional)",
    clickToUpload: "Click to upload",
    dragDrop: "or drag and drop",
    submitFeedback: "Submit Feedback",
    sending: "Sending...",
    thankYou: "Thank You!",
    
    creator: "Creator",
    contact: "Contact",
    version: "Version",

    // Tutorial Content
    tutorial_title: "How to Create",
    t_step1_title: "1. Folding Sequence",
    t_step1_desc: "Follow the interactive guides to fold the paper. Start by folding UP, then RIGHT, then the Corner.",
    t_step2_title: "2. Drawing & Cutting",
    t_step2_desc: "Draw on the colored area. The app highlights the center where you should draw.",
    t_step3_title: "3. Preview & Save",
    t_step3_desc: "Watch the real-time preview on the right. Click 'Save Result' to download and add to your gallery."
  },
  zh: {
    appTitle: "数字剪纸艺术",
    step_fold: "折叠",
    step_cut: "剪裁",
    
    // Controls
    tools: "工具栏",
    undo: "撤回",
    redo: "重做",
    thickness: "线条粗细",
    startOver: "重新开始",
    download: "下载保存",
    savePattern: "保存切割图",
    saveResult: "保存展开图",
    
    // Folding
    freeFold: "自由折叠",
    presetPatterns: "预设图案",
    resetPaper: "重置纸张",
    startCutting: "开始剪裁",
    fold_TL: "左上",
    fold_UP: "上",
    fold_TR: "右上",
    fold_LEFT: "左",
    fold_RIGHT: "右",
    fold_BL: "左下",
    fold_DOWN: "下",
    fold_BR: "右下",
    changeColor: "更换纸张颜色",
    
    // Hints
    hint_fold: "可以选择方向进行折叠",
    hint_cut: "现在可以开始作图了",
    
    // Interactive Guides - FOLD
    guide_fold_up: "1. 向上折叠",
    guide_fold_up_sub: "点击此处向上对折",
    guide_fold_right: "2. 向右折叠",
    guide_fold_right_sub: "点击此处向右对折",
    guide_fold_br: "3. 折叠右下角",
    guide_fold_br_sub: "增加一个对角线折叠",
    guide_fold_finish: "4. 开始剪纸",
    guide_fold_finish_sub: "折叠完成，进入剪裁阶段",

    // Interactive Guides - CUT
    guide_cut_tool: "自由画笔",
    guide_cut_tool_sub: "默认使用画笔，可自由绘制",
    guide_cut_canvas: "在此作图",
    guide_cut_canvas_sub: "在折叠区域绘制图案进行剪裁",
    guide_cut_preview: "实时效果",
    guide_cut_preview_sub: "此处实时显示展开后的样子",
    guide_cut_save: "保存作品",
    guide_cut_save_sub: "点击此处保存你的作品",
    
    // Settings Sidebar
    settingsTitle: "设置",
    tab_tutorial: "使用教程",
    tab_gallery: "我的作品",
    tab_theme: "外观设置",
    tab_feedback: "意见反馈",
    tab_about: "关于我们",
    
    // Settings Content
    mySavedWorks: "我的作品库",
    noSaves: "暂无保存的作品。快去创作并下载吧！",
    deleteConfirm: "确定要删除这个作品吗？",
    
    dynamicTheme: "动态图标颜色",
    dynamicThemeDesc: "界面按钮颜色跟随当前纸张颜色变化",
    
    yourSuggestion: "您的建议",
    placeholderFeedback: "请告诉我们要改进的地方...",
    uploadScreenshot: "上传截图 (选填)",
    clickToUpload: "点击上传",
    dragDrop: "或拖拽文件至此",
    submitFeedback: "提交反馈",
    sending: "发送中...",
    thankYou: "谢谢您的反馈！",
    
    creator: "创作者",
    contact: "联系方式",
    version: "版本号",

    // Tutorial Content
    tutorial_title: "创作指南",
    t_step1_title: "1. 折叠步骤",
    t_step1_desc: "跟随界面上的红色提示进行折叠。依次点击：向上折叠 -> 向右折叠 -> 右下角折叠。",
    t_step2_title: "2. 绘制与剪裁",
    t_step2_desc: "在中间的红色区域绘制图案。这里是折叠后的纸张，您的每一笔都会被剪切掉。",
    t_step3_title: "3. 预览与保存",
    t_step3_desc: "右侧实时显示展开后的完整图案。点击'保存展开图'即可下载并保存到作品库。"
  }
};
