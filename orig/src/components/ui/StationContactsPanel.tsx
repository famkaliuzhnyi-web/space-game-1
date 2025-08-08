import React, { useState } from 'react';
import { Contact } from '../../types/contacts';
import { Station } from '../../types/world';
import Modal from './Modal';

interface StationContactsPanelProps {
  isVisible: boolean;
  onClose: () => void;
  currentStation: Station | null;
  contacts: Contact[];
  onDiscoverContacts: () => Contact[];
  onInteractWithContact: (contactId: string, interactionType: string) => void;
}

const StationContactsPanel: React.FC<StationContactsPanelProps> = ({
  isVisible,
  onClose,
  currentStation,
  contacts,
  onDiscoverContacts,
  onInteractWithContact
}) => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'discover'>('contacts');

  if (!isVisible || !currentStation) return null;

  const handleDiscoverContacts = () => {
    const newContacts = onDiscoverContacts();
    if (newContacts.length > 0) {
      setActiveTab('contacts');
    }
  };

  const renderContactCard = (contact: Contact) => (
    <div
      key={contact.id}
      style={{
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px'
      }}
    >
      {/* Contact Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ 
            color: '#f3f4f6', 
            margin: '0 0 4px 0',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            {contact.name}
          </h4>
          <p style={{ 
            color: '#9ca3af', 
            margin: '0 0 8px 0', 
            fontSize: '13px'
          }}>
            {contact.role.name}
          </p>
        </div>
        <div style={{ textAlign: 'right', minWidth: '80px' }}>
          <div style={{ 
            color: '#10b981', 
            fontSize: '12px',
            marginBottom: '4px'
          }}>
            Trust: {contact.trustLevel}
          </div>
          <div style={{ 
            color: '#6b7280', 
            fontSize: '11px'
          }}>
            {contact.relationship.name}
          </div>
        </div>
      </div>

      {/* Contact Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => onInteractWithContact(contact.id, 'greeting')}
          style={{
            backgroundColor: '#374151',
            color: '#d1d5db',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          👋 Greet
        </button>
        <button
          onClick={() => onInteractWithContact(contact.id, 'business_deal')}
          style={{
            backgroundColor: '#374151',
            color: '#d1d5db',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          💼 Business
        </button>
        {contact.services && contact.services.length > 0 && (
          <button
            onClick={() => onInteractWithContact(contact.id, 'request_service')}
            style={{
              backgroundColor: '#1f2937',
              color: '#10b981',
              border: '1px solid #10b981',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🔧 Services ({contact.services.length})
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Modal isOpen={isVisible} onClose={onClose}>
      <div style={{
        backgroundColor: '#111827',
        border: '2px solid #374151',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '600px',
        width: '90vw',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px' 
        }}>
          <h2 style={{ 
            color: '#f3f4f6', 
            margin: '0',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            🏢 {currentStation.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              color: '#9ca3af',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              lineHeight: '1'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          marginBottom: '20px',
          borderBottom: '2px solid #374151'
        }}>
          <button
            onClick={() => setActiveTab('contacts')}
            style={{
              backgroundColor: activeTab === 'contacts' ? '#374151' : 'transparent',
              color: activeTab === 'contacts' ? '#f3f4f6' : '#9ca3af',
              border: 'none',
              padding: '12px 16px',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0',
              marginRight: '8px'
            }}
          >
            👥 Contacts ({contacts.length})
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            style={{
              backgroundColor: activeTab === 'discover' ? '#374151' : 'transparent',
              color: activeTab === 'discover' ? '#f3f4f6' : '#9ca3af',
              border: 'none',
              padding: '12px 16px',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0'
            }}
          >
            🔍 Meet People
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ minHeight: '300px' }}>
          {activeTab === 'contacts' && (
            <div>
              {contacts.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#9ca3af'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>👋</div>
                  <h3 style={{ color: '#f3f4f6', margin: '0 0 8px 0' }}>No Contacts Here Yet</h3>
                  <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
                    Visit the "Meet People" tab to discover contacts at this station.
                  </p>
                </div>
              ) : (
                contacts.map(renderContactCard)
              )}
            </div>
          )}

          {activeTab === 'discover' && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <h3 style={{ color: '#f3f4f6', margin: '0 0 16px 0' }}>
                Explore {currentStation.name}
              </h3>
              <p style={{ 
                color: '#9ca3af', 
                margin: '0 0 24px 0',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                Look around for people to meet. Station crew, merchants, and other 
                travelers might be willing to talk.
              </p>
              <button
                onClick={handleDiscoverContacts}
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🚀 Look for People
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default StationContactsPanel;