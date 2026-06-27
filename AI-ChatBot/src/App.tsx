import { useState } from 'react'
import {
  Search, Inbox, House, Ticket, AudioLines, Calendar,
  MessageCircle, BarChart3, Building2, Settings, CircleHelp,
  ChevronLeft, Filter, MoreHorizontal, Phone, MapPin,
  Paperclip, Smile, ImageIcon, Type, Send, Pencil,
  ChevronDown, Pause, X, Circle
} from 'lucide-react'

const agents = [
  { name: 'Claude Opus 4.8', specialty: 'Architecture & Reasoning', online: true },
  { name: 'Claude Opus 4.7', specialty: 'Complex Debugging', online: true },
  { name: 'Claude Opus 4.6', specialty: 'Agentic Workflows', online: true },
  { name: 'Claude Sonnet 4.6', specialty: 'Daily Driver — All Tasks', online: true },
  { name: 'Claude Sonnet 4.5', specialty: 'Balanced Chat', online: true },
  { name: 'Claude Haiku 4.5', specialty: 'Speed & High Volume', online: true },
  { name: 'GPT-5.5', specialty: 'Code Generation', online: true },
  { name: 'GPT-5.4', specialty: 'General Purpose', online: true },
  { name: 'GPT-5.4 Mini', specialty: 'Lightweight Tasks', online: true },
  { name: 'Gemini 3.1 Pro', specialty: 'Research & Analysis', online: true },
  { name: 'Blackbox', specialty: 'Untested', online: false },
]

type Session = { id: string; name: string; preview: string; unread: number }

const sessionsByAgent: Record<string, Session[]> = {
  'Claude Opus 4.8': [
    { id: '1', name: 'Cora Goyette', preview: 'Hi, I want to ask something...', unread: 1 },
    { id: '2', name: 'John Smith', preview: 'Need help with API architecture', unread: 0 },
  ],
  'Claude Opus 4.7': [
    { id: '3', name: 'Robert Chen', preview: 'Debugging production issue', unread: 2 },
    { id: '4', name: 'Sarah Lee', preview: 'Memory leak investigation', unread: 0 },
  ],
  'Claude Opus 4.6': [
    { id: '5', name: 'Mike Torres', preview: 'Multi-agent workflow design', unread: 1 },
  ],
  'Claude Sonnet 4.6': [
    { id: '6', name: 'Ms. Darin O\'Keefe', preview: 'Hi, I want to ask something...', unread: 2 },
    { id: '7', name: 'Irene Dicki', preview: 'Hi, I want to ask something...', unread: 0 },
    { id: '8', name: 'Mr. Rosemary Koss', preview: 'Hi, I want to ask something...', unread: 0 },
  ],
  'Claude Sonnet 4.5': [
    { id: '9', name: 'Emily Park', preview: 'Chat about subscription', unread: 1 },
  ],
  'Claude Haiku 4.5': [
    { id: '10', name: 'Alice Wang', preview: 'Quick question about...', unread: 3 },
    { id: '11', name: 'Tom Hudson', preview: 'Order status inquiry', unread: 0 },
  ],
  'GPT-5.5': [
    { id: '12', name: 'Alex Rivera', preview: 'Code review request', unread: 0 },
  ],
  'GPT-5.4': [
    { id: '13', name: 'Lisa Chen', preview: 'General assistance needed', unread: 0 },
  ],
  'GPT-5.4 Mini': [
    { id: '14', name: 'Sam Wilson', preview: 'Quick question', unread: 1 },
  ],
  'Gemini 3.1 Pro': [
    { id: '15', name: 'Dr. Patel', preview: 'Research data analysis', unread: 0 },
  ],
}

const activities = [
  { name: 'Justin Hickle', time: 'Feb 23, 18:43', text: 'Send Sarah an update by email by 4PM tomorrow.' },
  { name: 'Justin Hickle', time: 'Feb 23, 18:43', text: 'Send Sarah an update by email by 4PM tomorrow.' },
  { name: 'Justin Hickle', time: 'Feb 23, 18:43', text: 'Send Sarah an update by email by 4PM tomorrow.' },
]

function IconSidebar() {
  const topIcons = [
    { icon: Search, active: false },
    { icon: Inbox, active: false },
    { icon: House, active: false },
    { icon: Ticket, active: false },
    { icon: AudioLines, active: false },
    { icon: Calendar, active: false },
    { icon: MessageCircle, active: false },
    { icon: BarChart3, active: true },
    { icon: Building2, active: false },
  ]
  const bottomIcons = [
    { icon: Settings, active: false },
    { icon: CircleHelp, active: false },
  ]
  return (
    <div className="w-[52px] flex-shrink-0 bg-white border-r border-[#ECECEC] flex flex-col items-center py-3 justify-between">
      <div className="flex flex-col items-center gap-6">
        {topIcons.map(({ icon: Icon, active }, i) => (
          <Icon key={i} size={20} className={active ? 'text-[#2563EB]' : 'text-[#9CA3AF]'} strokeWidth={1.8} />
        ))}
      </div>
      <div className="flex flex-col items-center gap-6">
        {bottomIcons.map(({ icon: Icon, active }, i) => (
          <Icon key={i} size={20} className={active ? 'text-[#2563EB]' : 'text-[#9CA3AF]'} strokeWidth={1.8} />
        ))}
        <div className="w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs font-semibold text-[#111827]">U</div>
      </div>
    </div>
  )
}

function NavSidebar({ selectedAgent, onSelectAgent }: { selectedAgent: string; onSelectAgent: (name: string) => void }) {
  return (
    <div className="w-[220px] flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col p-4 gap-5 overflow-y-auto">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input className="w-full h-10 pl-9 pr-3 rounded-[10px] border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none" placeholder="Search chat" />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-[#9CA3AF] tracking-wider mb-2">INBOX</p>
        {[
          { label: 'All', count: 6 },
          { label: 'Assigned to me', count: 6, selected: true },
          { label: 'Unassigned', count: 6 },
        ].map((item, i) => (
          <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer ${item.selected ? 'bg-[#F3F4F6] text-[#111827] font-medium' : 'text-[#6B7280] hover:bg-[#F9FAFB]'}`}>
            <span>{item.label}</span>
            <span className="text-xs text-[#9CA3AF]">{item.count}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[11px] font-semibold text-[#9CA3AF] tracking-wider mb-2">STATUS</p>
        {[
          { label: 'All', count: 56, color: '#9CA3AF' },
          { label: 'Agent', count: 123, color: '#2563EB' },
          { label: 'Awaiting agent', count: 34, color: '#D97706' },
          { label: 'Paused', count: 89, color: '#EAB308' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-[#6B7280] cursor-pointer hover:bg-[#F9FAFB]">
            <div className="flex items-center gap-2">
              <Circle size={8} fill={item.color} stroke="none" />
              <span>{item.label}</span>
            </div>
            <span className="text-xs text-[#9CA3AF]">{item.count}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[11px] font-semibold text-[#9CA3AF] tracking-wider mb-2">CHANNEL</p>
        {[
          { label: 'All', count: 56 },
          { label: 'SMS', count: 123 },
          { label: 'Whatsapp', count: 34 },
          { label: 'Instagram', count: 89 },
          { label: 'Web', count: 89 },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-[#6B7280] cursor-pointer hover:bg-[#F9FAFB]">
            <span>{item.label}</span>
            <span className="text-xs text-[#9CA3AF]">{item.count}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[11px] font-semibold text-[#9CA3AF] tracking-wider mb-2">AGENTS</p>
        {agents.map((agent, i) => (
          <div
            key={i}
            onClick={() => onSelectAgent(agent.name)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer ${selectedAgent === agent.name ? 'bg-[#F3F4F6]' : 'hover:bg-[#F9FAFB]'}`}
          >
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs font-medium text-[#6B7280]">{agent.name.split(' ').slice(-2).map(s => s[0]).join('')}</div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${agent.online ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#111827] truncate">{agent.name}</p>
              <p className="text-xs text-[#6B7280] truncate">{agent.specialty}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SessionList({ sessions, selectedSession, onSelectSession }: { sessions: Session[]; selectedSession: string; onSelectSession: (id: string) => void }) {
  return (
    <div className="w-[300px] flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col">
      <div className="flex items-center gap-2 px-4 h-14 border-b border-[#E5E7EB]">
        <ChevronLeft size={18} className="text-[#6B7280]" />
        <span className="text-sm font-semibold text-[#111827]">Sessions</span>
      </div>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E5E7EB]">
        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#F9FAFB]">
          <Filter size={14} />
          Filter
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2878D9] rounded-lg text-xs font-medium text-[#2878D9]">Open</button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#F9FAFB]">Newest</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[#F3F4F6] ${selectedSession === session.id ? 'bg-[#FAFAFA]' : 'hover:bg-[#FAFAFA]'}`}
          >
            <div className="w-9 h-9 rounded-full bg-[#E5E7EB] flex-shrink-0 flex items-center justify-center text-xs font-medium text-[#6B7280]">
              {session.name.split(' ').slice(-2).map(s => s[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#111827] truncate">{session.name}</p>
                <MoreHorizontal size={14} className="text-[#9CA3AF] flex-shrink-0 ml-2" />
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs text-[#6B7280] truncate">{session.preview}</p>
                {session.unread > 0 && (
                  <div className="w-4 h-4 rounded bg-[#D97706] flex items-center justify-center flex-shrink-0 ml-2">
                    <span className="text-[10px] font-bold text-white">{session.unread}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Conversation() {
  return (
    <div className="flex-1 flex flex-col bg-white min-w-0">
      <div className="flex items-center justify-between px-5 h-14 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs font-medium text-[#6B7280]">CG</div>
          <div>
            <p className="text-sm font-semibold text-[#111827]">Cora Goyette</p>
            <p className="text-xs text-[#22C55E]">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#F9FAFB]">
            <Pause size={14} />
            Pause
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] text-white rounded-lg text-xs font-medium hover:bg-[#1F2937]">
            <X size={14} />
            Close
          </button>
          <ChevronDown size={16} className="text-[#6B7280]" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        <div className="max-w-[400px] ml-auto">
          <div className="bg-[#2878D9] text-white rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line">
            Thank you.<br /><br />Please enter the amount and date of the transaction<br /><br />(eg 100, December 21th).
          </div>
          <p className="text-xs text-[#9CA3AF] text-right mt-1">13:34</p>
        </div>
        <div className="max-w-[400px] mr-auto">
          <div className="bg-[#F5F5F5] text-[#111827] rounded-2xl px-4 py-3 text-sm leading-relaxed">
            Okay, the amount is $500 and the date is December 21th 2023.
          </div>
          <p className="text-xs text-[#9CA3AF] mt-1">13:35</p>
        </div>
        <div className="max-w-[400px] ml-auto">
          <div className="bg-[#2878D9] text-white rounded-2xl px-4 py-3 text-sm leading-relaxed">
            Thank you for the information.
          </div>
          <p className="text-xs text-[#9CA3AF] text-right mt-1">13:36</p>
        </div>
        <div className="max-w-[400px] ml-auto space-y-2">
          <button className="w-full px-4 py-2.5 border border-[#2878D9] text-[#2878D9] rounded-lg text-sm font-medium hover:bg-[#F0F7FF]">
            Retry Checking the Balance
          </button>
          <button className="w-full px-4 py-2.5 border border-[#2878D9] text-[#2878D9] rounded-lg text-sm font-medium hover:bg-[#F0F7FF]">
            Speak to a Representative
          </button>
        </div>
        <div className="flex justify-center">
          <div className="inline-flex items-center px-4 py-1.5 bg-[#F0F7FF] rounded-full text-xs text-[#6B7280]">
            Chat got taken over by customer service
          </div>
        </div>
        <div className="max-w-[400px] ml-auto">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-[#2563EB] flex-shrink-0 mt-2 flex items-center justify-center text-[10px] font-medium text-white">A</div>
            <div className="flex-1">
              <div className="bg-[#2878D9] text-white rounded-2xl px-4 py-3 text-sm leading-relaxed">
                Hi, this is Alex from Customer Support.<br /><br />I see you're having an issue with your top-up.
              </div>
              <p className="text-xs text-[#9CA3AF] mt-1">13:38</p>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-[#E5E7EB] px-5 py-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl">
          <textarea className="w-full resize-none outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] px-4 pt-3 h-20" placeholder='Type "/" to use template message' />
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-2">
              <Paperclip size={16} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
              <Smile size={16} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
              <ImageIcon size={16} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
              <Type size={16} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#F9FAFB]">Assign to Form</button>
              <button className="flex items-center gap-1.5 px-4 py-1.5 bg-[#D97706] text-white rounded-lg text-xs font-medium hover:bg-[#B45309]">
                Send
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoPanel() {
  return (
    <div className="w-[320px] flex-shrink-0 bg-white border-l border-[#E5E7EB] flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs font-medium text-[#6B7280]">CG</div>
          <p className="text-sm font-semibold text-[#111827]">Cora Goyette</p>
        </div>
        <Pencil size={16} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
      </div>
      <div className="px-5 py-4 space-y-3 border-b border-[#E5E7EB]">
        {[
          { label: 'Channel', value: 'WhatsAppB2B' },
          { label: 'ID', value: '2023113142356' },
          { label: 'Phone', value: '+6267976229012', icon: Phone },
          { label: 'Address', value: '5467 Richmond View\nSuite 511\nSunrise\nKentucky\n43546-6636', icon: MapPin },
        ].map((item, i) => (
          <div key={i}>
            <p className="text-xs text-[#9CA3AF] mb-0.5">{item.label}</p>
            <div className="flex items-start gap-1.5">
              {item.icon && <item.icon size={14} className="text-[#9CA3AF] mt-0.5 flex-shrink-0" />}
              <p className="text-sm text-[#111827] whitespace-pre-line">{item.value}</p>
            </div>
          </div>
        ))}
        <button className="text-xs text-[#2878D9] font-medium hover:underline">+ Add new attribute</button>
      </div>
      <div className="px-5 py-4 border-b border-[#E5E7EB]">
        <p className="text-xs font-semibold text-[#9CA3AF] tracking-wider mb-2">NOTES</p>
        <div className="border border-[#E5E7EB] rounded-lg">
          <textarea className="w-full h-20 resize-none outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] px-3 pt-2" placeholder="Write a note..." />
          <div className="flex items-center gap-2 px-3 pb-2">
            <Paperclip size={14} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
            <Smile size={14} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex-1">
        <p className="text-xs font-semibold text-[#9CA3AF] tracking-wider mb-3">ACTIVITY</p>
        <div className="space-y-4">
          {activities.map((a, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#E5E7EB] flex-shrink-0 mt-0.5 flex items-center justify-center text-[10px] font-medium text-[#6B7280]">
                {a.name.split(' ').map(s => s[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#111827]">{a.name}</p>
                  <MoreHorizontal size={12} className="text-[#9CA3AF] flex-shrink-0" />
                </div>
                <p className="text-xs text-[#9CA3AF]">{a.time}</p>
                <p className="text-xs text-[#6B7280] mt-1">{a.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [selectedAgent, setSelectedAgent] = useState(agents[0].name)
  const [selectedSession, setSelectedSession] = useState('1')
  const sessions = sessionsByAgent[selectedAgent] || []

  return (
    <div className="h-full flex bg-[#FAFAFA] font-['Inter',sans-serif]">
      <IconSidebar />
      <NavSidebar selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} />
      <SessionList sessions={sessions} selectedSession={selectedSession} onSelectSession={setSelectedSession} />
      <Conversation />
      <InfoPanel />
    </div>
  )
}
