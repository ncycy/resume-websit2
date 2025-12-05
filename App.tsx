import React, { useState, useEffect } from 'react';
import { INITIAL_PROFILE } from './constants';
import { ProfileData } from './types';
import { Editable } from './components/Editable';
import { EditIcon, CheckIcon, PlusIcon, TrashIcon, MailIcon, GlobeIcon, MapPinIcon, SparklesIcon, DownloadIcon, TranslateIcon } from './components/Icons';
import { generateThemeImage, translateProfileData } from './services/geminiService';

const TABS = [
  { id: 'home', label: '首页', labelEn: 'Home' },
  { id: 'publications', label: '学术论著', labelEn: 'Publications' },
  { id: 'projects', label: '主持课题', labelEn: 'Projects' },
  { id: 'honors', label: '获奖荣誉', labelEn: 'Honors & Awards' },
  { id: 'services', label: '学术兼职', labelEn: 'Services' },
  { id: 'admissions', label: '招生信息', labelEn: 'Admissions' },
  { id: 'teaching', label: '指导学生', labelEn: 'Teaching' },
  { id: 'gallery', label: '我的相册', labelEn: 'Gallery' },
  { id: 'others', label: '其他栏目', labelEn: 'Others' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  
  // Translation State
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [isTranslating, setIsTranslating] = useState(false);
  const [enProfile, setEnProfile] = useState<ProfileData | null>(null);

  const [rawProfile, setRawProfile] = useState<ProfileData>(() => {
    const saved = localStorage.getItem('academic_profile_v4');
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  // Derived state: Use English profile if language is 'en', otherwise raw (Chinese) profile
  const profile = language === 'en' && enProfile ? enProfile : rawProfile;

  useEffect(() => {
    localStorage.setItem('academic_profile_v4', JSON.stringify(rawProfile));
  }, [rawProfile]);

  const updateField = (field: keyof ProfileData, value: string) => {
    if (language === 'en') return; // Read-only in English mode
    setRawProfile(prev => ({ ...prev, [field]: value }));
  };

  const updateArrayItem = (
    listName: keyof ProfileData,
    id: string,
    field: string,
    value: string
  ) => {
    if (language === 'en') return;
    // @ts-ignore
    setRawProfile(prev => ({
      ...prev,
      [listName]: (prev[listName] as any[]).map((item) => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const addItem = (listName: keyof ProfileData, overrides: any = {}) => {
    if (language === 'en') return;
    const newId = Date.now().toString();
    setRawProfile(prev => {
      let newItem: any = { id: newId, ...overrides };
      if (listName === 'education' && !newItem.school) newItem = { ...newItem, year: '20xx - 20xx', school: '学校名称', degree: '学位', major: '专业' };
      if (listName === 'experience' && !newItem.organization) newItem = { ...newItem, year: '20xx - 20xx', organization: '单位名称', role: '职务' };
      if (listName === 'honors' && !newItem.title) newItem = { ...newItem, year: '2024', title: '荣誉/奖项名称', level: '级别', type: overrides.type || 'award' };
      if (listName === 'services' && !newItem.role) newItem = { ...newItem, role: '社会兼职/学术服务' };
      if (listName === 'teaching' && !newItem.content) newItem = { ...newItem, content: '指导学生获奖情况...' };
      if (listName === 'publications' && !newItem.title) newItem = { ...newItem, title: '论文题目', authors: '作者', venue: '发表期刊/出版社', year: '2024', type: overrides.type || 'journal' };
      if (listName === 'projects' && !newItem.title) newItem = { ...newItem, title: '项目名称', role: '主持人', funding: '资助来源', duration: '2024-2026', amount: 'xx万' };
      if (listName === 'gallery' && !newItem.url) newItem = { ...newItem, url: 'https://picsum.photos/400/300', caption: '图片描述' };
      if (listName === 'others' && !newItem.title) newItem = { ...newItem, title: '标题', content: '内容描述...' };
      
      // Append to end of list
      // @ts-ignore
      return { ...prev, [listName]: [...(prev[listName] as any[]), newItem] };
    });
  };

  const deleteItem = (listName: keyof ProfileData, id: string) => {
    if (language === 'en') return;
    if (window.confirm("确认删除此项?")) {
      // @ts-ignore
      setRawProfile(prev => ({
        ...prev,
        [listName]: (prev[listName] as any[]).filter((item) => item.id !== id)
      }));
    }
  };

  const handleGenerateBanner = async () => {
    const userPrompt = prompt("请输入您想要的背景描述 (例如：蓝色科技感连接点线，或者 宁静的图书馆书架):");
    if (userPrompt === null) return;

    setIsLoadingImage(true);
    try {
      const imageUrl = await generateThemeImage(userPrompt);
      updateField('bannerUrl', imageUrl);
    } catch (e) {
      alert("Failed to generate image. Please check your API key.");
    } finally {
      setIsLoadingImage(false);
    }
  };

  const handleLanguageToggle = async () => {
    if (language === 'zh') {
        // Switching to English
        setIsTranslating(true);
        try {
            // Only translate if we don't have a cached one or if user forces (not implementing force for now for simplicity)
            // In a real app, you might check a 'dirty' flag. Here we just translate every time to be safe or check if null.
            // For better UX, let's translate every time they switch to ensure it catches latest edits.
            const translated = await translateProfileData(rawProfile);
            setEnProfile(translated);
            setLanguage('en');
            setIsEditing(false); // Disable editing in English mode
        } catch (error) {
            alert("Translation failed. Please check your network and API Key.");
        } finally {
            setIsTranslating(false);
        }
    } else {
        // Switching back to Chinese
        setLanguage('zh');
    }
  };

  const handleExportConfig = () => {
      const dataStr = "export const INITIAL_PROFILE = " + JSON.stringify(rawProfile, null, 2) + ";";
      navigator.clipboard.writeText(dataStr).then(() => {
          alert("配置已复制到剪贴板！\n\n请打开代码中的 'constants.ts' 文件，粘贴并覆盖原内容。\n然后您可以部署代码以发布更新。");
      });
  };

  // --- Content Renderers ---

  const renderProfileHeader = () => (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-8 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden mb-8">
         <div className="absolute top-0 left-0 right-0 h-1 bg-academic-600"></div>

         <div className="shrink-0 w-32 md:w-40 relative group self-center md:self-start">
              <div className="aspect-[3/4] w-full rounded shadow-md overflow-hidden bg-slate-100">
                <img 
                    src={profile.avatarUrl} 
                    alt={profile.name} 
                    className="w-full h-full object-cover" 
                />
              </div>
              {isEditing && language === 'zh' && (
                    <button 
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity text-sm rounded text-center p-2"
                        onClick={() => {
                            const url = prompt("输入照片 URL:", profile.avatarUrl);
                            if (url) updateField('avatarUrl', url);
                        }}
                    >
                        更换照片
                    </button>
                )}
         </div>

         <div className="flex-1 min-w-0 py-2 w-full">
             <div className="flex flex-col md:flex-row items-center md:items-baseline gap-2 md:gap-4 mb-2 justify-center md:justify-start">
                 <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">
                    <Editable value={profile.name} isEditing={isEditing} onSave={(v) => updateField('name', v)} />
                 </h1>
                 {/* PhD Label - Static or simple translation */}
                 <div className="px-3 py-1 bg-academic-50 text-academic-800 rounded-full text-xs font-semibold tracking-wide border border-academic-100 uppercase">
                     {language === 'zh' ? '博士' : 'Ph.D.'}
                 </div>
             </div>
             
             <div className="text-lg md:text-xl text-slate-700 font-medium mb-4 flex flex-col md:flex-row items-center md:items-center gap-2 justify-center md:justify-start">
                 <Editable value={profile.title} isEditing={isEditing} onSave={(v) => updateField('title', v)} />
                 <span className="hidden md:inline text-slate-300">|</span>
                 <span className="text-academic-600 font-semibold cursor-pointer hover:underline">
                    <Editable value={profile.affiliation} isEditing={isEditing} onSave={(v) => updateField('affiliation', v)} />
                 </span>
             </div>

             <div className="w-full h-px bg-slate-100 my-4"></div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm text-slate-600">
                 <div className="flex items-center gap-2 justify-center md:justify-start">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 shrink-0">
                        <span className="font-serif font-bold">T</span>
                    </span>
                    <Editable value={profile.phone} isEditing={isEditing} onSave={(v) => updateField('phone', v)} placeholder="电话" />
                 </div>
                 <div className="flex items-center gap-2 justify-center md:justify-start">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 shrink-0">
                        <MailIcon className="w-3 h-3" />
                    </span>
                    <Editable value={profile.email} isEditing={isEditing} onSave={(v) => updateField('email', v)} />
                 </div>
                 <div className="flex items-center gap-2 col-span-1 md:col-span-2 justify-center md:justify-start">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 shrink-0">
                        <MapPinIcon className="w-3 h-3" />
                    </span>
                    <Editable value={profile.location} isEditing={isEditing} onSave={(v) => updateField('location', v)} />
                 </div>
                 <div className="flex items-start gap-2 col-span-1 md:col-span-2 mt-2 justify-center md:justify-start text-center md:text-left">
                     <span className="shrink-0 font-bold text-slate-800">{language === 'zh' ? '研究方向:' : 'Research Interests:'}</span>
                     <Editable value={profile.researchInterests} isEditing={isEditing} onSave={(v) => updateField('researchInterests', v)} />
                 </div>
             </div>
         </div>

         <div className="shrink-0 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 w-full md:w-auto mt-6 md:mt-0">
             <div className="relative group w-28 h-28 bg-white border p-2 rounded shadow-sm">
                 <img src={profile.qrCodeUrl || 'https://via.placeholder.com/150?text=QR'} alt="QR Code" className="w-full h-full object-contain" />
                 {isEditing && language === 'zh' && (
                    <button 
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity text-center p-1"
                        onClick={() => {
                            const url = prompt("输入二维码图片 URL:", profile.qrCodeUrl);
                            if (url) updateField('qrCodeUrl', url);
                        }}
                    >
                        更换二维码
                    </button>
                )}
             </div>
             <span className="text-xs text-slate-400 mt-2">{language === 'zh' ? '扫码访问主页' : 'Scan to Visit'}</span>
         </div>
      </div>
  );

  const renderHome = () => (
    <div className="animate-fade-in space-y-8">
      {/* Bio */}
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8">
        <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 font-serif">{language === 'zh' ? '个人简介' : 'Biography'}</h3>
        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-justify">
            <Editable 
                tag="div"
                value={profile.bio} 
                isEditing={isEditing} 
                onSave={(v) => updateField('bio', v)} 
                multiline
            />
        </div>
      </div>

      <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
                    <h3 className="text-xl font-bold text-slate-900 font-serif">{language === 'zh' ? '教育经历' : 'Education'}</h3>
                    {isEditing && <button onClick={() => addItem('education')} className="text-xs bg-slate-100 px-3 py-1.5 rounded hover:bg-slate-200 font-medium">添加</button>}
                </div>
                <div className="space-y-6">
                     {profile.education.map((edu) => (
                        <div key={edu.id} className="relative pl-6 border-l-2 border-slate-200 ml-2">
                            <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                                 <div className="font-bold text-slate-900 text-lg"><Editable value={edu.school} isEditing={isEditing} onSave={(v) => updateArrayItem('education', edu.id, 'school', v)} /></div>
                                 <div className="text-sm text-slate-500"><Editable value={edu.year} isEditing={isEditing} onSave={(v) => updateArrayItem('education', edu.id, 'year', v)} /></div>
                             </div>
                             <div className="text-slate-700"><Editable value={edu.degree} isEditing={isEditing} onSave={(v) => updateArrayItem('education', edu.id, 'degree', v)} /> <span className="text-slate-400 mx-1">|</span> <Editable value={edu.major || ''} isEditing={isEditing} onSave={(v) => updateArrayItem('education', edu.id, 'major', v)} placeholder="专业" /></div>
                             {isEditing && <button onClick={() => deleteItem('education', edu.id)} className="text-red-400 text-xs mt-2 hover:underline">删除</button>}
                        </div>
                     ))}
                </div>
             </div>

             <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8">
                 <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
                    <h3 className="text-xl font-bold text-slate-900 font-serif">{language === 'zh' ? '工作经历' : 'Experience'}</h3>
                    {isEditing && <button onClick={() => addItem('experience')} className="text-xs bg-slate-100 px-3 py-1.5 rounded hover:bg-slate-200 font-medium">添加</button>}
                </div>
                <div className="space-y-6">
                     {profile.experience.map((exp) => (
                        <div key={exp.id} className="relative pl-6 border-l-2 border-academic-600 ml-2">
                            <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-academic-600"></div>
                             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                                 <div className="font-bold text-slate-900 text-lg"><Editable value={exp.organization} isEditing={isEditing} onSave={(v) => updateArrayItem('experience', exp.id, 'organization', v)} /></div>
                                 <div className="text-sm text-slate-500"><Editable value={exp.year} isEditing={isEditing} onSave={(v) => updateArrayItem('experience', exp.id, 'year', v)} /></div>
                             </div>
                             <div className="font-medium text-academic-700"><Editable value={exp.role} isEditing={isEditing} onSave={(v) => updateArrayItem('experience', exp.id, 'role', v)} /></div>
                             <div className="text-slate-600 text-sm mt-1"><Editable value={exp.description || ''} isEditing={isEditing} onSave={(v) => updateArrayItem('experience', exp.id, 'description', v)} placeholder="详情描述..." /></div>
                             {isEditing && <button onClick={() => deleteItem('experience', exp.id)} className="text-red-400 text-xs mt-2 hover:underline">删除</button>}
                        </div>
                     ))}
                </div>
             </div>
      </div>
    </div>
  );

  const renderPublications = () => (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8 animate-fade-in">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
             <h2 className="text-2xl font-bold font-serif text-slate-900">{language === 'zh' ? '学术论著' : 'Publications'}</h2>
        </div>

        <div className="mb-10">
            <div className="flex justify-between items-center mb-4 bg-slate-50 p-3 border-l-4 border-academic-600">
                <h3 className="text-lg font-bold text-slate-800">{language === 'zh' ? '学术论文' : 'Journal Papers'}</h3>
                {isEditing && <button onClick={() => addItem('publications', { type: 'journal' })} className="text-xs bg-white border border-academic-200 text-academic-700 px-2 py-1 rounded hover:bg-academic-50">添加论文</button>}
            </div>
            <ul className="space-y-4">
                {profile.publications.filter(p => p.type !== 'book' && p.type !== 'conference').map((pub, idx) => (
                    <li key={pub.id} className="flex gap-2 text-slate-700">
                        <span className="font-bold text-slate-400">[{idx + 1}]</span>
                        <div className="flex-1">
                            <span className="font-semibold text-slate-900"><Editable value={pub.title} isEditing={isEditing} onSave={(v) => updateArrayItem('publications', pub.id, 'title', v)} /></span>
                            <div className="text-sm mt-1">
                                <Editable value={pub.authors} isEditing={isEditing} onSave={(v) => updateArrayItem('publications', pub.id, 'authors', v)} />
                            </div>
                            <div className="text-sm italic mt-1 text-slate-600">
                                <Editable value={pub.venue} isEditing={isEditing} onSave={(v) => updateArrayItem('publications', pub.id, 'venue', v)} />
                                , <Editable value={pub.year} isEditing={isEditing} onSave={(v) => updateArrayItem('publications', pub.id, 'year', v)} />
                                {pub.tag && <span className="ml-2 not-italic text-xs bg-blue-100 text-blue-800 px-1 rounded"><Editable value={pub.tag} isEditing={isEditing} onSave={(v) => updateArrayItem('publications', pub.id, 'tag', v)} /></span>}
                            </div>
                            {isEditing && <button onClick={() => deleteItem('publications', pub.id)} className="mt-1 text-red-500 text-xs hover:underline">删除</button>}
                        </div>
                    </li>
                ))}
            </ul>
        </div>

        <div>
            <div className="flex justify-between items-center mb-4 bg-slate-50 p-3 border-l-4 border-academic-600">
                <h3 className="text-lg font-bold text-slate-800">{language === 'zh' ? '著作与教材' : 'Books & Textbooks'}</h3>
                {isEditing && <button onClick={() => addItem('publications', { type: 'book' })} className="text-xs bg-white border border-academic-200 text-academic-700 px-2 py-1 rounded hover:bg-academic-50">添加著作</button>}
            </div>
            <ul className="space-y-4">
                {profile.publications.filter(p => p.type === 'book').map((pub, idx) => (
                    <li key={pub.id} className="flex gap-2 text-slate-700">
                        <span className="font-bold text-slate-400">[{idx + 1}]</span>
                        <div className="flex-1">
                            <Editable value={pub.authors} isEditing={isEditing} onSave={(v) => updateArrayItem('publications', pub.id, 'authors', v)} />.
                            <span className="font-bold mx-1"><Editable value={pub.title} isEditing={isEditing} onSave={(v) => updateArrayItem('publications', pub.id, 'title', v)} /></span>.
                            <Editable value={pub.venue} isEditing={isEditing} onSave={(v) => updateArrayItem('publications', pub.id, 'venue', v)} />
                            , <Editable value={pub.year} isEditing={isEditing} onSave={(v) => updateArrayItem('publications', pub.id, 'year', v)} />.
                            {isEditing && <button onClick={() => deleteItem('publications', pub.id)} className="ml-2 text-red-500 text-xs hover:underline">删除</button>}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    </div>
  );

  const renderProjects = () => (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8 animate-fade-in">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
             <h2 className="text-2xl font-bold font-serif text-slate-900">{language === 'zh' ? '主持课题' : 'Research Projects'}</h2>
             {isEditing && <button onClick={() => addItem('projects')} className="flex items-center gap-1 text-sm bg-academic-600 text-white px-3 py-1 rounded hover:bg-academic-700"><PlusIcon className="w-4 h-4" /> 添加</button>}
        </div>
        <div className="space-y-6">
            {profile.projects.map((proj) => (
                <div key={proj.id} className="border-b border-slate-100 last:border-0 pb-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                             <h3 className="text-lg font-bold text-slate-800 mb-2">
                                <Editable value={proj.title} isEditing={isEditing} onSave={(v) => updateArrayItem('projects', proj.id, 'title', v)} />
                            </h3>
                            <div className="text-sm text-slate-600 space-y-1">
                                <div className="flex gap-2">
                                    <span className="font-semibold text-academic-700">{language === 'zh' ? '项目来源:' : 'Source:'}</span>
                                    <Editable value={proj.funding || ''} isEditing={isEditing} onSave={(v) => updateArrayItem('projects', proj.id, 'funding', v)} />
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded mb-1">
                                 <Editable value={proj.duration || ''} isEditing={isEditing} onSave={(v) => updateArrayItem('projects', proj.id, 'duration', v)} />
                            </span>
                            <span className="text-sm font-medium text-green-600">
                                <Editable value={proj.description} isEditing={isEditing} onSave={(v) => updateArrayItem('projects', proj.id, 'description', v)} />
                            </span>
                             {isEditing && <button onClick={() => deleteItem('projects', proj.id)} className="mt-2 text-red-400 text-xs underline"><TrashIcon className="w-4 h-4" /></button>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderHonors = () => (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8 animate-fade-in">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
             <h2 className="text-2xl font-bold font-serif text-slate-900">{language === 'zh' ? '获奖荣誉' : 'Honors & Awards'}</h2>
        </div>

        {/* Section 1: Honors */}
        <div className="mb-10">
            <div className="flex justify-between items-center mb-4 bg-slate-50 p-3 border-l-4 border-academic-600">
                 <h3 className="text-lg font-bold text-slate-800">{language === 'zh' ? '个人荣誉' : 'Honors'}</h3>
                 {isEditing && <button onClick={() => addItem('honors', { type: 'honor' })} className="text-xs bg-white border border-academic-200 text-academic-700 px-2 py-1 rounded hover:bg-academic-50">添加荣誉</button>}
            </div>
            <div className="grid gap-4">
                {profile.honors.filter(h => h.type === 'honor').map((honor) => (
                    <div key={honor.id} className="flex gap-4 p-4 bg-slate-50 rounded-lg group">
                        <div className="font-bold text-academic-600 shrink-0 w-16 text-right border-r border-slate-200 pr-4">
                            <Editable value={honor.year} isEditing={isEditing} onSave={(v) => updateArrayItem('honors', honor.id, 'year', v)} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between">
                                <h4 className="font-bold text-slate-800">
                                    <Editable value={honor.title} isEditing={isEditing} onSave={(v) => updateArrayItem('honors', honor.id, 'title', v)} />
                                </h4>
                                {isEditing && <button onClick={() => deleteItem('honors', honor.id)} className="text-red-400"><TrashIcon className="w-4 h-4" /></button>}
                            </div>
                            <div className="text-sm text-slate-500 mt-1">
                                {honor.level && <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-xs mr-2"><Editable value={honor.level} isEditing={isEditing} onSave={(v) => updateArrayItem('honors', honor.id, 'level', v)} /></span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Section 2: Awards */}
        <div>
            <div className="flex justify-between items-center mb-4 bg-slate-50 p-3 border-l-4 border-academic-600">
                 <h3 className="text-lg font-bold text-slate-800">{language === 'zh' ? '教学科研获奖' : 'Awards'}</h3>
                 {isEditing && <button onClick={() => addItem('honors', { type: 'award' })} className="text-xs bg-white border border-academic-200 text-academic-700 px-2 py-1 rounded hover:bg-academic-50">添加奖项</button>}
            </div>
             <div className="grid gap-4">
                {profile.honors.filter(h => h.type === 'award' || !h.type).map((honor) => (
                    <div key={honor.id} className="flex gap-4 p-4 bg-slate-50 rounded-lg group">
                        <div className="font-bold text-academic-600 shrink-0 w-16 text-right border-r border-slate-200 pr-4">
                            <Editable value={honor.year} isEditing={isEditing} onSave={(v) => updateArrayItem('honors', honor.id, 'year', v)} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between">
                                <h4 className="font-bold text-slate-800">
                                    <Editable value={honor.title} isEditing={isEditing} onSave={(v) => updateArrayItem('honors', honor.id, 'title', v)} />
                                </h4>
                                {isEditing && <button onClick={() => deleteItem('honors', honor.id)} className="text-red-400"><TrashIcon className="w-4 h-4" /></button>}
                            </div>
                            <div className="text-sm text-slate-500 mt-1">
                                <Editable value={honor.description || ''} isEditing={isEditing} onSave={(v) => updateArrayItem('honors', honor.id, 'description', v)} placeholder="详情描述..." />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  const renderAdmissions = () => (
     <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8 animate-fade-in">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
             <h2 className="text-2xl font-bold font-serif text-slate-900">{language === 'zh' ? '招生信息' : 'Admissions'}</h2>
        </div>
        <div className="prose prose-lg max-w-none text-slate-700">
             <Editable 
                tag="div"
                value={profile.admissionsText} 
                isEditing={isEditing} 
                onSave={(v) => updateField('admissionsText', v)} 
                multiline
                className="min-h-[300px]"
            />
        </div>
    </div>
  );

  const renderTeaching = () => (
     <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8 animate-fade-in">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
             <h2 className="text-2xl font-bold font-serif text-slate-900">{language === 'zh' ? '指导学生' : 'Teaching & Supervision'}</h2>
             {isEditing && <button onClick={() => addItem('teaching')} className="flex items-center gap-1 text-sm bg-academic-600 text-white px-3 py-1 rounded hover:bg-academic-700"><PlusIcon className="w-4 h-4" /> 添加</button>}
        </div>
        <ul className="space-y-4">
            {profile.teaching.map((item, idx) => (
                <li key={item.id} className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded transition-colors group">
                    <span className="text-academic-500 mt-1"><CheckIcon className="w-5 h-5" /></span>
                    <div className="flex-1 text-slate-700 leading-relaxed">
                         <Editable value={item.content} isEditing={isEditing} onSave={(v) => updateArrayItem('teaching', item.id, 'content', v)} multiline />
                    </div>
                     {isEditing && <button onClick={() => deleteItem('teaching', item.id)} className="text-red-400 opacity-50 group-hover:opacity-100"><TrashIcon className="w-4 h-4" /></button>}
                </li>
            ))}
        </ul>
    </div>
  );

  const renderGallery = () => (
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8 animate-fade-in">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
             <h2 className="text-2xl font-bold font-serif text-slate-900">{language === 'zh' ? '我的相册' : 'Gallery'}</h2>
             {isEditing && <button onClick={() => addItem('gallery')} className="flex items-center gap-1 text-sm bg-academic-600 text-white px-3 py-1 rounded hover:bg-academic-700"><PlusIcon className="w-4 h-4" /> 添加图片</button>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.gallery.map((item) => (
                <div key={item.id} className="group relative rounded-lg overflow-hidden shadow-sm border border-slate-100 bg-slate-50">
                    <img src={item.url} alt={item.caption} className="w-full h-48 object-cover transition-transform group-hover:scale-105" />
                     {isEditing && (
                        <div className="absolute top-2 right-2 flex gap-2">
                             <button 
                                onClick={() => {
                                    const url = prompt("输入图片 URL:", item.url);
                                    if(url) updateArrayItem('gallery', item.id, 'url', url);
                                }}
                                className="bg-white/80 p-1.5 rounded-full hover:bg-white"
                             >
                                 <EditIcon className="w-4 h-4 text-slate-800" />
                             </button>
                             <button onClick={() => deleteItem('gallery', item.id)} className="bg-white/80 p-1.5 rounded-full hover:bg-red-100 text-red-500">
                                 <TrashIcon className="w-4 h-4" />
                             </button>
                        </div>
                     )}
                    <div className="p-3 text-center text-sm font-medium text-slate-700">
                         <Editable value={item.caption} isEditing={isEditing} onSave={(v) => updateArrayItem('gallery', item.id, 'caption', v)} />
                    </div>
                </div>
            ))}
        </div>
      </div>
  );

  const renderServices = () => (
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8 animate-fade-in">
         <div className="flex justify-between items-center mb-6 border-b pb-4">
             <h2 className="text-2xl font-bold font-serif text-slate-900">{language === 'zh' ? '学术兼职' : 'Academic Services'}</h2>
             {isEditing && <button onClick={() => addItem('services')} className="flex items-center gap-1 text-sm bg-academic-600 text-white px-3 py-1 rounded hover:bg-academic-700"><PlusIcon className="w-4 h-4" /> 添加</button>}
        </div>
        <ul className="space-y-3">
             {profile.services.map((item) => (
                <li key={item.id} className="flex gap-3 items-start group">
                    <span className="w-2 h-2 rounded-full bg-academic-400 mt-2 shrink-0"></span>
                    <div className="flex-1 text-slate-700">
                         <Editable value={item.role} isEditing={isEditing} onSave={(v) => updateArrayItem('services', item.id, 'role', v)} multiline />
                    </div>
                     {isEditing && <button onClick={() => deleteItem('services', item.id)} className="text-red-400 opacity-50 group-hover:opacity-100"><TrashIcon className="w-4 h-4" /></button>}
                </li>
             ))}
        </ul>
      </div>
  );

  const renderOthers = () => (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8 animate-fade-in">
       <div className="flex justify-between items-center mb-6 border-b pb-4">
           <h2 className="text-2xl font-bold font-serif text-slate-900">{language === 'zh' ? '其他栏目' : 'Others'}</h2>
           {isEditing && <button onClick={() => addItem('others')} className="flex items-center gap-1 text-sm bg-academic-600 text-white px-3 py-1 rounded hover:bg-academic-700"><PlusIcon className="w-4 h-4" /> 添加</button>}
      </div>
      <div className="space-y-6">
           {profile.others.map((item) => (
              <div key={item.id} className="group border-b border-slate-100 pb-4 last:border-0">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                       <Editable value={item.title} isEditing={isEditing} onSave={(v) => updateArrayItem('others', item.id, 'title', v)} placeholder="标题" />
                  </h3>
                  <div className="text-slate-700">
                       <Editable value={item.content} isEditing={isEditing} onSave={(v) => updateArrayItem('others', item.id, 'content', v)} multiline placeholder="内容..." />
                  </div>
                   {isEditing && <button onClick={() => deleteItem('others', item.id)} className="text-red-400 opacity-50 group-hover:opacity-100 text-sm mt-2"><TrashIcon className="w-4 h-4" /> 删除</button>}
              </div>
           ))}
      </div>
    </div>
);

  // --- Main Layout ---

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-20">
        {/* Banner Section */}
        <div className="relative h-64 lg:h-[300px] w-full bg-slate-900 overflow-hidden group">
            <img 
            src={profile.bannerUrl} 
            alt="Banner" 
            className="w-full h-full object-cover opacity-80" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none" />
            
            {/* Top Bar - Language */}
            <div className="absolute top-4 left-4 z-30">
                <button 
                    onClick={handleLanguageToggle}
                    disabled={isTranslating}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all font-medium border border-white/20 shadow-lg"
                >
                    <TranslateIcon className="w-4 h-4" />
                    {isTranslating ? 'Translating...' : (language === 'zh' ? 'English Version' : '中文版')}
                </button>
            </div>

            {/* Edit Controls */}
             <div className="absolute top-4 right-4 z-20 flex gap-4 flex-col md:flex-row items-end">
                {isEditing && language === 'zh' && (
                    <>
                        <button
                            onClick={handleExportConfig}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm shadow-lg font-medium"
                            title="Export data to code for deployment"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            导出数据 (发布)
                        </button>
                        <button
                            onClick={handleGenerateBanner}
                            disabled={isLoadingImage}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 disabled:opacity-50 transition-colors text-sm border border-white/20"
                        >
                            <SparklesIcon className={`w-4 h-4 ${isLoadingImage ? 'animate-spin' : ''}`} />
                            {isLoadingImage ? "AI 生成中..." : "AI 生成背景"}
                        </button>
                    </>
                )}
                 <button
                    onClick={() => {
                        if (language === 'en') {
                            alert("Please switch to Chinese version to edit content.");
                            return;
                        }
                        setIsEditing(!isEditing);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all text-sm shadow-lg ${
                        isEditing 
                        ? 'bg-green-500 text-white hover:bg-green-600' 
                        : 'bg-white text-slate-800 hover:bg-slate-200'
                    } ${language === 'en' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isEditing ? <><CheckIcon className="w-4 h-4" /> 完成编辑</> : <><EditIcon className="w-4 h-4" /> 编辑模式</>}
                </button>
            </div>
        </div>

        {/* Profile Header & Tabs Container */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative -mt-24 z-10">
            {/* Persistent Profile Header */}
            {renderProfileHeader()}

            {/* Navigation Bar */}
            <div className="bg-white rounded-t-lg border-b border-slate-200 shadow-sm overflow-hidden mb-6">
                 <div className="flex overflow-x-auto no-scrollbar">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-4 text-sm font-bold uppercase tracking-wide whitespace-nowrap border-b-2 transition-colors ${
                                activeTab === tab.id
                                ? 'border-academic-600 text-academic-800 bg-slate-50'
                                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                        >
                            {language === 'zh' ? tab.label : tab.labelEn}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'home' && renderHome()}
                {activeTab === 'publications' && renderPublications()}
                {activeTab === 'projects' && renderProjects()}
                {activeTab === 'honors' && renderHonors()}
                {activeTab === 'services' && renderServices()}
                {activeTab === 'admissions' && renderAdmissions()}
                {activeTab === 'teaching' && renderTeaching()}
                {activeTab === 'gallery' && renderGallery()}
                {activeTab === 'others' && renderOthers()}
            </div>
        </div>

        <footer className="bg-slate-800 text-slate-400 py-12 mt-12 text-center text-sm">
            <p className="mb-2">{profile.name} - {profile.affiliation}</p>
            <p>© {new Date().getFullYear()} ScholarFolio. All rights reserved.</p>
        </footer>
    </div>
  );
};

export default App;
