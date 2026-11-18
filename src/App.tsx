import { useState, useEffect, useRef } from 'react'
import {
  MessagesSquare,
  ArrowRight,
  Lock,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Settings,
  Save,
  Home,
  Globe,
  Plane,
  User,
  ShoppingCart,
} from 'lucide-react'
import { LiquidNavbar } from './components/LiquidNavbar'
import type { LiquidNavItem, NimbusFx } from './components/LiquidNavbar'
import logoDaMata from '../logo-da-mata.png'
import './App.css'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyD_oB6qWhOH2u4xUS9mnRV4LVRMLGE3pAE",
  authDomain: "da-mata-db52a.firebaseapp.com",
  projectId: "da-mata-db52a",
  storageBucket: "da-mata-db52a.firebasestorage.app",
  messagingSenderId: "764978468119",
  appId: "1:764978468119:web:71356972f996b2f7f29352",
  measurementId: "G-VN1SWNZD51"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const productsRef = collection(db, 'products')

const VIDEO_URL =
  'https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663228113460/mslsqRNFsqjxAQWo.mp4?Expires=1824199139&Signature=fRRlYj75St6iBracVEJ4pB9MZnokV7uFMMip~CVzrd00suXstcyRbb4pJ6PLwHRaSj9We8lO~YAk0dOseOhvcuLWkET1E93XgVXbJhqZ~m2rDzT~XhneeM8AtkYtNCYWcXZw5B1zJtTG~QQl6xTB4c8ZcGxftrcG-zfDUKsg5OhL~DO1YAJCTgxDuWAhBfg3Drdnc0bvcVWUnk1gTomzEJxLWMH~GLMWoV96JqyHuLiNdr4goOce0ShmgYI-LWoUz2fhzFyuBQCaUz~MPoWc-d-SzjPnCPW9ANMbDyS1Q1huaoM5N8pbPdgRQsMyqLR4x1iPHxuWLtY7Mmf4ntgKCA__&Key-Pair-Id=K10M74EMLURLMC'

const whatsappUrl = 'https://wa.me/5512988850145'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'damata@@'

const defaultPieces = [
  {
    id: 'colar-flor',
    name: 'Colar Flor do Campo',
    category: 'Colar',
    price: 'R$ 189,00',
    description: 'Flor seca preservada em resina, corrente em banho de ouro.',
    color: '#e9c8b5',
    image: '',
  },
  {
    id: 'brinco-folha',
    name: 'Brinco Folha',
    category: 'Brinco',
    price: 'R$ 149,00',
    description: 'Par de brincos com folha natural encapsulada em resina.',
    color: '#cdbfe3',
    image: '',
  },
  {
    id: 'pulseira-margarida',
    name: 'Pulseira Margarida',
    category: 'Pulseira',
    price: 'R$ 169,00',
    description: 'Margarida miniaturizada em resina com fecho delicado.',
    color: '#f1d9a8',
    image: '',
  },
  {
    id: 'anel-violeta',
    name: 'Anel Violeta',
    category: 'Anel',
    price: 'R$ 129,00',
    description: 'Pétala de violeta em resina sobre prata 925.',
    color: '#8a5a8c',
    image: '',
  },
  {
    id: 'brinco-orquidea',
    name: 'Brinco Orquídea',
    category: 'Brinco',
    price: 'R$ 179,00',
    description: 'Orquídea preservada com acabamento em ouro velho.',
    color: '#e9c8b5',
    image: '',
  },
  {
    id: 'colar-folha-seca',
    name: 'Colar Folha Seca',
    category: 'Colar',
    price: 'R$ 159,00',
    description: 'Folha natural em resina, pingente alongado.',
    color: '#cdbfe3',
    image: '',
  },
]

type Piece = typeof defaultPieces[0]

export default function App() {
  const [adminMode, setAdminMode] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminError, setAdminError] = useState('')
const [adminSuccess, setAdminSuccess] = useState('')
  const [products, setProducts] = useState<Piece[]>([])
  const [editing, setEditing] = useState<Piece | null>(null)
  const [form, setForm] = useState<Partial<Piece>>({})
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState(0) // 0=Início, 1=Portfólio, 2=Sobre, 3=Contato
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carrinho de compras
  interface CartItem {
    piece: Piece
    quantity: number
  }
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  const parsePrice = (price: string): number => {
    return parseFloat(price.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0
  }

  const formatPrice = (value: number): string => {
    return value.toFixed(2).replace('.', ',')
  }

  const cartTotal = cart.reduce((sum, item) => sum + parsePrice(item.piece.price) * item.quantity, 0)

  const addToCart = (piece: Piece) => {
    setCart(prev => {
      const existing = prev.find(item => item.piece.id === piece.id)
      if (existing) {
        return prev.map(item =>
          item.piece.id === piece.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { piece, quantity: 1 }]
    })
    setCartOpen(true)
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.piece.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setCart(prev => prev.map(item =>
      item.piece.id === id ? { ...item, quantity } : item
    ))
  }

  const generateWhatsAppMessage = (): string => {
    if (cart.length === 0) return 'Seu carrinho está vazio.'

    const itemsList = cart.map((item, index) => {
      const price = parsePrice(item.piece.price)
      const itemTotal = price * item.quantity
      return `${index + 1}. ${item.piece.name} (${item.piece.category}) x${item.quantity} - R$ ${formatPrice(itemTotal)}`
    }).join('\n')

    const totalFormatted = formatPrice(cartTotal)

    return `Olá! Tudo bem? 🌿

Gostei da(s) seguinte(s) peça(s) da da mata:

${itemsList}

Valor total: R$ ${totalFormatted}

Podemos confirmar a compra?

Obrigada! 💚`
  }

  // Carrega produtos do Firestore
  useEffect(() => {
    const q = query(productsRef)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Piece))
      setProducts(data.length > 0 ? data : defaultPieces)
    })
    return () => unsubscribe()
  }, [])

  // Persiste produto individual no Firestore
  const persistProduct = async (piece: Piece, isNew: boolean) => {
    const { id, ...rest } = piece
    if (isNew) {
      await addDoc(productsRef, rest)
    } else if (id) {
      await updateDoc(doc(db, 'products', id), rest)
    }
  }

  // Remove produto do Firestore
  const removeProduct = async (id: string) => {
    await deleteDoc(doc(db, 'products', id))
  }

  const categories = Array.from(new Set(products.map((p) => p.category))).sort()

  // ESC fecha a área do desenvolvedor
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAdminMode(false)
        setEditing(null)
        setForm({})
        setAdminError('')
        setIsAuthenticated(false)
        setAdminPassword('')
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setAdminError('')
      setAdminSuccess('')
      setAdminPassword('')
    } else {
      setAdminError('Senha incorreta')
      setAdminSuccess('')
    }
  }

  const handleLogout = () => {
    setAdminMode(false)
    setIsAuthenticated(false)
    setEditing(null)
    setForm({})
    setAdminError('')
    setAdminPassword('')
  }

  const resetForm = () => {
    setEditing(null)
    setForm({ name: '', category: '', price: '', description: '', color: '#8a5a8c', image: '' })
  }

// const startAdd = () => {
//   resetForm()
// }

  const startEdit = (piece: Piece) => {
    setEditing(piece)
    setForm({ ...piece })
  }

  function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Tempo esgotado — verifique sua conexão e as regras do Firestore')), ms)
    )
    return Promise.race([promise, timeout])
  }

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.category || !form.price || !form.description) {
      setAdminError('Preencha todos os campos')
      return
    }
    setSaving(true)
    setAdminError('')
    setAdminSuccess('')
    const newPiece: Piece = {
      id: editing?.id || `prod-${Date.now()}`,
      name: form.name,
      category: form.category,
      price: form.price,
      description: form.description,
      color: form.color || '#8a5a8c',
      image: form.image || '',
    }
    try {
      console.log('Tentando salvar produto:', newPiece)
      await withTimeout(persistProduct(newPiece, !editing), 10000)
      console.log('Produto salvo com sucesso!')
      setAdminSuccess('Produto salvo com sucesso!')
      setAdminError('')
      if (editing) {
        setProducts(products.map((p) => (p.id === editing.id ? newPiece : p)))
      } else {
        setProducts([...products, newPiece])
      }
    } catch (err: any) {
      console.error('Erro ao salvar:', err)
      setAdminError('Erro ao salvar produto: ' + err.message)
      setAdminSuccess('')
      alert('Erro ao salvar: ' + err.message + '\nVerifique as regras do Firestore no Firebase Console.')
    } finally {
      setSaving(false)
    }
    resetForm()
    setTimeout(() => setAdminSuccess(''), 4000)
  }

  const deleteProduct = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este produto?')) {
      try {
        console.log('Tentando remover produto ID:', id)
        await withTimeout(removeProduct(id), 10000)
        console.log('Produto removido com sucesso!')
        setAdminSuccess('Produto removido com sucesso!')
        setAdminError('')
        setProducts(products.filter((p) => p.id !== id))
      } catch (err: any) {
        console.error('Erro ao remover:', err)
        setAdminError('Erro ao remover: ' + err.message)
        setAdminSuccess('')
        alert('Erro ao remover: ' + err.message + '\nVerifique as regras do Firestore no Firebase Console.')
      }
    }
  }

  const handleFormChange = (key: keyof Piece) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setAdminError('')
    setForm({ ...form, [key]: e.target.value })
  }

  // Scrollspy: destaca o item ativo da navbar conforme a seção visível
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id
            const index = ['inicio', 'portfolio', 'sobre', 'contato'].indexOf(id)
            if (index !== -1) {
              setActiveSection(index)
            }
          }
        })
      },
      { root: null, rootMargin: '-20% 0% -60% 0%', threshold: 0 }
    )

    const sections = ['inicio', 'portfolio', 'sobre', 'contato']
    sections.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const navItems: LiquidNavItem[] = [
    { label: "Início", href: "#inicio", icon: <Home className="w-5 h-5" />, fx: "glow" as NimbusFx },
    { label: "Portfólio", href: "#portfolio", icon: <Globe className="w-5 h-5" />, fx: "drop" as NimbusFx },
    { label: "Sobre", href: "#sobre", icon: <Plane className="w-5 h-5" />, fx: "spin" as NimbusFx },
    { label: "Contato", href: "#contato", fx: "wave" as NimbusFx },
    { label: "WhatsApp", href: whatsappUrl, icon: <MessagesSquare className="w-5 h-5" />, fx: "glow" as NimbusFx },
    { label: "Admin", onClick: () => setAdminMode(true), icon: <User className="w-5 h-5" />, fx: "pop" as NimbusFx },
  ]

  return (
    <div className="bg-[#faf7f2] text-[#1f1a24] min-h-screen">
      {/* Admin login overlay */}
      {adminMode && !isAuthenticated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#faf7f2]/95 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 sm:p-12 w-full max-w-md shadow-xl border border-[#e9e1d6]">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-6 h-6 text-[#1f1a24]" />
              <h2 className="text-xl font-bold text-[#1f1a24]">Área do Desenvolvedor</h2>
            </div>
            <p className="text-[#5b5163] text-sm mb-6">Digite a senha para acessar o painel de controle</p>
            {adminError && (
              <p className="text-sm text-[#c98f7a] mb-4 font-medium">{adminError}</p>
            )}
            <form onSubmit={handleLogin} className="space-y-3">
              <label className="block text-xs font-medium text-[#5b5163] mb-1">Senha</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#e9e1d6] bg-[#faf7f2] text-[#1f1a24] focus:border-[#2a1f33] focus:outline-none transition-colors"
                placeholder="••••••••"
              />
              <button
                type="submit"
                className="w-full bg-[#2a1f33] text-[#faf7f2] py-3 rounded-lg font-medium hover:bg-[#3b2d47] transition-colors"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full mt-3 bg-[#f1e9de] text-[#5b5163] py-3 rounded-lg font-medium hover:bg-[#e9dccf] transition-colors"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin dashboard overlay */}
      {adminMode && isAuthenticated && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 bg-[#faf7f2]/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl border border-[#e9e1d6]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-[#1f1a24]" />
                <h2 className="text-xl font-bold text-[#1f1a24]">Painel de Controle</h2>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm text-[#5b5163] hover:text-[#1f1a24] transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>

            {/* Mensagem de sucesso (verde) */}
            {adminSuccess && (
              <div className="mb-4 p-4 bg-[#d1fae5] border border-[#10b981] rounded-xl text-[#065f46] text-sm font-medium flex items-center justify-between">
                <span>{adminSuccess}</span>
                <button
                  onClick={() => setAdminSuccess('')}
                  className="ml-4 text-[#065f46] hover:underline"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Mensagem de erro (vermelho) */}
            {adminError && (
              <div className="mb-4 p-4 bg-[#fee2e2] border border-[#ef4444] rounded-xl text-[#991b1b] text-sm font-medium flex items-center justify-between">
                <span>{adminError}</span>
                <button
                  onClick={() => setAdminError('')}
                  className="ml-4 text-[#991b1b] hover:underline"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="space-y-6">
              {/* Adicionar / editar produto */}
              <div className="bg-[#faf7f2] rounded-xl p-6 border border-[#e6dccf]">
                <h3 className="text-lg font-bold text-[#1f1a24] mb-4 flex items-center gap-2">
                  {editing ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {editing ? 'Editar Produto' : 'Adicionar Produto'}
                </h3>
                <form onSubmit={saveProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#5b5163] mb-1">Nome da peça</label>
                    <input
                      name="name"
                      value={form.name || ''}
                      onChange={handleFormChange('name')}
                      className="w-full px-4 py-3 rounded-lg border border-[#e9e1d6] bg-white text-[#1f1a24] focus:border-[#2a1f33] focus:outline-none transition-colors"
                      placeholder="Ex: Colar Flor do Campo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5b5163] mb-1">Categoria</label>
                    <select
                      value={form.category || ''}
                      onChange={handleFormChange('category')}
                      className="w-full px-4 py-3 rounded-lg border border-[#e9e1d6] bg-white text-[#1f1a24] focus:border-[#2a1f33] focus:outline-none transition-colors"
                    >
                      <option value="">Escolha uma categoria</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="Nova categoria">+ Nova categoria</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5b5163] mb-1">Preço</label>
                    <input
                      name="price"
                      type="text"
                      value={form.price || ''}
                      onChange={handleFormChange('price')}
                      className="w-full px-4 py-3 rounded-lg border border-[#e9e1d6] bg-white text-[#1f1a24] focus:border-[#2a1f33] focus:outline-none transition-colors"
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#5b5163] mb-1">Descrição</label>
                    <textarea
                      name="description"
                      value={form.description || ''}
                      onChange={handleFormChange('description')}
                      rows={2}
                      className="w-full px-4 py-3 rounded-lg border border-[#e9e1d6] bg-white text-[#1f1a24] focus:border-[#2a1f33] focus:outline-none transition-colors"
                      placeholder="Descreva a peça..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5b5163] mb-1">Cor do gradiente</label>
                    <input
                      name="color"
                      type="color"
                      value={form.color || '#8a5a8c'}
                      onChange={handleFormChange('color')}
                      className="w-full h-10 rounded-lg border-none bg-transparent cursor-pointer"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex gap-3 mb-2">
                      <label className="block text-xs font-medium text-[#5b5163] mb-0">URL da imagem (opcional)</label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-3 rounded-lg border border-[#e9e1d6] bg-[#faf7f2] text-[#5b5163] text-sm font-medium hover:bg-[#e9e1d6] transition-colors"
                      >
                        Importar do dispositivo
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onload = () => {
                            setForm({ ...form, image: reader.result as string })
                            setAdminError('')
                          }
                          reader.readAsDataURL(file)
                        }}
                      />
                    </div>
                    <input
                      name="image"
                      type="text"
                      value={form.image || ''}
                      onChange={handleFormChange('image')}
                      className="w-full px-4 py-3 rounded-lg border border-[#e9e1d6] bg-white text-[#1f1a24] focus:border-[#2a1f33] focus:outline-none transition-colors"
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                    <p className="text-xs text-[#5b5163] mt-1">Deixe em branco para usar letra com gradiente</p>
                  </div>
                  <div className="sm:col-span-2 flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 flex items-center gap-2 justify-center bg-[#2a1f33] text-[#faf7f2] py-3 rounded-lg font-medium hover:bg-[#3b2d47] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Save className="w-4 h-4 mr-2 animate-spin" />
                          <span>Salvando...</span>
                        </>
                      ) : editing ? (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          <span>Salvar alterações</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          <span>Salvar produto</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 rounded-lg border border-[#e9e1d6] bg-white text-[#5b5163] font-medium hover:bg-[#f1e9de] transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>

              {/* Lista de produtos */}
              <div className="bg-[#faf7f2] rounded-xl p-6 border border-[#e6dccf]">
                <h3 className="text-lg font-bold text-[#1f1a24] mb-4 flex items-center gap-2">
                  Produtos ({products.length})
                </h3>
                <div className="space-y-3">
                  {products.length === 0 ? (
                    <p className="text-[#5b5163] text-sm text-center py-4">Nenhum produto cadastrado.</p>
                  ) : (
                    products.map((piece) => (
                      <div
                        key={piece.id}
                        className="flex items-center gap-4 p-4 bg-white rounded-lg border border-[#e6dccf] hover:border-[#c98f7a] transition-colors"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#8a5a8c]/10 flex items-center justify-center">
                          {piece.image ? (
                            <img src={piece.image} alt={piece.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-serif italic" style={{ color: piece.color }}>
                              {piece.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1f1a24] truncate">{piece.name}</p>
                          <p className="text-xs text-[#5b5163] truncate">{piece.category}</p>
                          <p className="text-sm font-medium text-[#1f1a24]">{piece.price}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(piece)}
                            className="w-8 h-8 rounded-lg border border-[#e9e1d6] bg-white text-[#5b5163] flex items-center justify-center hover:bg-[#f1e9de] hover:text-[#1f1a24] transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(piece.id)}
                            className="w-8 h-8 rounded-lg border border-[#e9e1d6] bg-white text-[#c98f7a] flex items-center justify-center hover:bg-[#fdecec] hover:text-[#c98f7a] transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero section — full viewport */}
      <section id="inicio" className="relative h-[100dvh] overflow-hidden flex flex-col">
        {/* Background video */}
        <video
          className="absolute inset-0 w-full h-full object-cover pt-[120px] md:pt-[200px]"
          autoPlay
          loop
          muted
          playsInline
          poster=""
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>

        {/* Seamless fluid gradient blending: field → portfolio, no sudden cuts */}
        <div
          className="absolute inset-0 z-5 pointer-events-none animate-gradient-drift"
          style={{
            background:
              'radial-gradient(60% 80% at 50% 0%, rgba(138, 90, 140, 0.30) 0%, rgba(205, 191, 227, 0.16) 30%, rgba(233, 200, 181, 0.10) 55%, rgba(250, 247, 242, 0) 100%)',
          }}
        />

        {/* Video fade-out overlays */}
        <div className="absolute top-[120px] left-0 right-0 h-[200px] bg-gradient-to-b from-[#faf7f2] to-transparent pointer-events-none z-10" />
        <div className="hidden md:block absolute top-[200px] left-0 right-0 h-[300px] bg-gradient-to-b from-[#faf7f2] to-transparent pointer-events-none z-10" />
        <div className="md:hidden absolute top-[120px] left-0 right-0 h-[200px] bg-gradient-to-b from-[#faf7f2] to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-[240px] bg-gradient-to-t from-[rgba(31,26,36,0.35)] to-transparent pointer-events-none z-10" />

        {/* Navbar — fixa no topo, sempre visível ao descer a página */}
        <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4 flex items-center justify-center gap-4 sm:gap-0 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <div className="flex items-center justify-center">
            <img src={logoDaMata} alt="da mata" className="h-10 sm:h-12 w-auto" />
          </div>
          <LiquidNavbar
            tone="light"
            compact={false}
            sound={false}
            active={activeSection}
            items={navItems}
          />
          <button
            onClick={() => setCartOpen(true)}
            className="fixed bottom-24 right-8 z-50 bg-[#2a1f33] text-[#faf7f2] w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-[#3b2d47] transition-colors animate-bounce"
            title="Carrinho"
          >
            <ShoppingCart className="w-7 h-7" />
            {cart.length > 0 && (
              <span className="absolute top-1 right-1 w-3 h-3 bg-[#c98f7a] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </nav>

        {/* Hero content */}
        <main className="relative z-20 px-4 sm:px-6 pt-[120px] sm:pt-[200px] pb-16 sm:pb-32 max-w-7xl mx-auto text-center flex flex-col items-center justify-center min-h-[calc(100dvh-200px)]">
          {/* Heading — frase de efeito */}
          <h1 className="text-[38px] sm:text-6xl md:text-7xl lg:text-[84px] font-bold leading-[1.04] tracking-[-0.035em] text-[#1f1a24] mb-4 sm:mb-5 animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
            <img src={logoDaMata} alt="da mata" className="h-24 sm:h-32 w-auto mb-2 sm:mb-4 mx-auto" />
            <span className="text-[#1f1a24] font-bold animate-gradient-drift">
              Peças únicas que nascem da natureza
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-[#ffffff] font-semibold mb-6 sm:mb-8 max-w-2xl mx-auto px-2 animate-fade-in-up" style={{ animationDelay: '0.4s', opacity: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            Joias feitas à mão com flores e folhas reais, preservadas em resina. Cada peça é única, assim como quem a usa.
          </p>

          {/* CTA — WhatsApp */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.5s', opacity: 0 }}>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center gap-2 bg-[#2a1f33] text-[#faf7f2] px-6 sm:px-8 py-3 rounded-full text-sm sm:text-base font-medium hover:bg-[#3b2d47] transition-colors"
            >
              Falar pelo WhatsApp <ArrowRight className="w-4 h-4 fill-current group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </main>
      </section>

      {/* Seção de peças — portfólio */}
      <section id="portfolio" className="py-20 sm:py-32 px-4 sm:px-6 bg-[#faf7f2]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-[#1f1a24] mb-3 animate-fade-in-up" style={{ animationDelay: '0.6s', opacity: 0 }}>
              Portfólio
            </h2>
            <p className="text-[#5b5163] text-base sm:text-lg animate-fade-in-up" style={{ animationDelay: '0.7s', opacity: 0 }}>
              Cada peça é feita com carinho, usando flores e folhas reais preservadas em resina.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {products.map((piece, idx) => (
              <div
                key={piece.id}
                className={`group relative rounded-2xl overflow-hidden border border-[#e6dccf] bg-white shadow-sm hover:shadow-md transition-shadow duration-300 animate-fade-in-up`}
                style={{
                  animationDelay: `${0.8 + idx * 0.1}s`,
                  opacity: 0,
                }}
              >
                <div className="relative h-48 sm:h-64 overflow-hidden bg-[#8a5a8c]/10 group-hover:bg-[#8a5a8c]/20 transition-colors duration-300">
                  {piece.image ? (
                    <img
                      src={piece.image}
                      alt={piece.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center text-white/90 text-2xl sm:text-3xl font-serif italic" style={{ color: piece.color }}>
                        {piece.name.charAt(0)}
                      </div>
                      <div className="absolute inset-0 bg-[#8a5a8c]/5 group-hover:bg-[#8a5a8c]/15 transition-colors duration-300" />
                    </>
                  )}
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-[#1f1a24] mb-1">{piece.name}</h3>
                  <p className="text-xs sm:text-sm text-[#5b5163] mb-1">{piece.category}</p>
                  <p className="text-sm sm:text-base font-medium text-[#1f1a24] mb-3">{piece.price}</p>
                  <p className="text-sm text-[#3d3444] mb-4 line-clamp-2">{piece.description}</p>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => addToCart(piece)}
                      className="flex-1 bg-[#1f1a24] text-[#faf7f2] px-4 py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-[#3b2d47] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3 h-3" />
                      Carrinho
                    </button>
                    <a
                      href={`${whatsappUrl}?text=Ol%C3%A1%20Jorge!%20Tenho%20interesse%20na%20pe%C3%A7a%3A%20${encodeURIComponent(piece.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#2a1f33] text-[#faf7f2] px-4 py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-[#3b2d47] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MessagesSquare className="w-3 h-3" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Seção Sobre */}
      <section id="sobre" className="py-20 sm:py-32 px-4 sm:px-6 bg-[#faf7f2]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-[#1f1a24] mb-3">Sobre a da mata</h2>
            <p className="text-[#5b5163] text-base sm:text-lg max-w-2xl mx-auto">
              Joias feitas à mão com flores e folhas reais, preservadas em resina. Cada peça é única, assim como quem a usa. Trabalhamos com carinho e dedicação para entregar joias que carregam a essência da natureza.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="bg-white rounded-2xl p-8 border border-[#e6dccf] shadow-sm">
              <h3 className="text-xl font-bold text-[#1f1a24] mb-4">Nosso trabalho</h3>
              <p className="text-[#5b5163] text-sm leading-relaxed mb-4">
                Cada joia é cuidadosamente produzida com flores e folhas naturais, encapsuladas em resina de alta qualidade. O resultado é uma peça durável, delicada e cheia de significado.
              </p>
              <p className="text-[#5b5163] text-sm leading-relaxed">
                Ideal para presentes, datas especiais ou para você mesma carregar um pouco da natureza consigo.
              </p>
            </div>
            <div className="h-64 sm:h-80 rounded-2xl overflow-hidden border border-[#e6dccf] bg-gradient-to-br from-[#8a5a8c]/20 to-[#e9c8b5]/20 flex items-center justify-center">
              <span className="text-4xl sm:text-5xl font-serif italic text-white/90">JB</span>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Contato */}
      <section id="contato" className="py-20 sm:py-32 px-4 sm:px-6 bg-[#faf7f2]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-[#1f1a24] mb-3">Fale Conosco</h2>
            <p className="text-[#5b5163] text-base sm:text-lg max-w-2xl mx-auto">
              Tem alguma dúvida ou quer fazer um pedido especial? Chame a gente pelo WhatsApp.
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full group relative flex items-center justify-center gap-2 bg-[#2a1f33] text-[#faf7f2] px-6 py-4 rounded-full text-sm sm:text-base font-medium hover:bg-[#3b2d47] transition-colors"
            >
              <MessagesSquare className="w-5 h-5" />
              Falar pelo WhatsApp
            </a>
            <p className="mt-6 text-center text-[#5b5163] text-sm">
              Atendimento por WhatsApp • da mata
            </p>
          </div>
        </div>
      </section>

      {/* Rodapé simples */}
      <footer className="border-t border-[#e6dccf] bg-white/80 py-8 sm:py-12 text-center">
        <p className="text-[#5b5163] text-sm sm:text-base">
          da mata — Feito à mão com flores e folhas reais{' '}
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-[#1f1a24] font-medium hover:underline">
            Fale pelo WhatsApp
          </a>
        </p>
      </footer>

      {/* Modal do Carrinho */}
      {cartOpen && (
        <div className="fixed inset-0 z-[60] bg-[#1f1a24]/60 backdrop-blur-sm flex items-center justify-center" onClick={() => setCartOpen(false)}>
          <div className="bg-[#faf7f2] rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden border border-[#e9e1d6] m-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#2a1f33] p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#faf7f2] flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Seu Carrinho
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="text-[#faf7f2]/70 hover:text-[#faf7f2] text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto p-4 max-h-[60vh]">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#5b5163] text-sm">Seu carrinho está vazio.</p>
                  <p className="text-[#5b5163] text-xs mt-2">Adicione peças do portfólio.</p>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.piece.id} className="flex gap-3 mb-4 items-center">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#8a5a8c]/10 flex items-center justify-center flex-shrink-0">
                        {item.piece.image ? (
                          <img src={item.piece.image} alt={item.piece.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-serif italic" style={{ color: item.piece.color }}>
                            {item.piece.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1f1a24] text-sm truncate">{item.piece.name}</p>
                        <p className="text-xs text-[#5b5163] truncate">{item.piece.category}</p>
                        <p className="text-sm font-medium text-[#1f1a24]">{item.piece.price}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.piece.id, item.quantity - 1)}
                            className="w-7 h-7 rounded border border-[#e9e1d6] bg-white text-[#5b5163] text-xs flex items-center justify-center hover:bg-[#f1e9de] transition-colors"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-xs font-medium text-[#1f1a24]">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.piece.id, item.quantity + 1)}
                            className="w-7 h-7 rounded border border-[#e9e1d6] bg-white text-[#5b5163] text-xs flex items-center justify-center hover:bg-[#f1e9de] transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.piece.id)}
                        className="text-[#c98f7a] hover:text-[#c98f7a]/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <div className="border-t border-[#e6dccf] pt-4 mt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-[#5b5163] text-sm">Subtotal:</span>
                      <span className="font-medium text-[#1f1a24] text-sm">R$ {formatPrice(cartTotal)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="bg-[#2a1f33] p-4 flex gap-3">
                <button
                  onClick={() => {
                    setCart([])
                    setCartOpen(false)
                  }}
                  className="flex-1 bg-transparent border border-[#faf7f2]/30 text-[#faf7f2]/70 py-3 rounded-lg font-medium hover:bg-[#faf7f2]/10 transition-colors"
                >
                  Limpar
                </button>
                <a
                  href={`${whatsappUrl}?text=${encodeURIComponent(generateWhatsAppMessage())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#128c7e] text-[#faf7f2] py-3 rounded-lg font-medium hover:bg-[#0d6e5d] transition-colors flex items-center justify-center gap-2"
                >
                  <MessagesSquare className="w-4 h-4" />
                  Enviar pelo WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

