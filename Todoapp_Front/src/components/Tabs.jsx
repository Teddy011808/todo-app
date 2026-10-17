function Tabs({ tabs, activeTab, onChange }) {
  return (
    <nav className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          id={`tab-${tab.value}`}
          role="tab"
          aria-selected={activeTab === tab.value}
          aria-controls={`panel-${tab.value}`}
          className={`tab ${activeTab === tab.value ? 'active' : ''}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.icon}
          <span className="tab-label">{tab.label}</span>
          {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
        </button>
      ))}
    </nav>
  )
}

export default Tabs
