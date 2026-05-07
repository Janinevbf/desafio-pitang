

export const Select = ({ children, onValueChange, value, required }: any) => {
    // Passamos a função de mudança para os filhos de forma simples
    return (
        <div className="relative w-full">
            <select
                required={required}
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {children}
            </select>
        </div>
    )
}

export const SelectTrigger = ({ children }: any) => <>{children}</>
export const SelectContent = ({ children }: any) => <>{children}</>
// Adicione este componente aqui se ele não existir:
export const SelectItem = ({ value, children }: any) => (
    <option value={value}>{children}</option>
)

// O SelectValue não é necessário para o select nativo, 
// mas vamos deixar como fragmento para não quebrar seu Form
export const SelectValue = ({ placeholder }: any) => (
    <option value="" disabled hidden>{placeholder}</option>
)