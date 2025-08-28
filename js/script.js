// script.js

// Classes em POO para o sistema financeiro
class Transaction {
    constructor(id, date, description, category, type, value, notes = '') {
        this.id = id;
        this.date = date;
        this.description = description;
        this.category = category;
        this.type = type;
        this.value = value;
        this.notes = notes;
    }

    getFormattedDate() {
        return new Date(this.date).toLocaleDateString('pt-BR');
    }

    getFormattedValue() {
        return this.value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    getCategoryName() {
        const categories = {
            'food': 'Alimentação',
            'transport': 'Transporte',
            'housing': 'Moradia',
            'health': 'Saúde',
            'education': 'Educação',
            'entertainment': 'Entretenimento',
            'other': 'Outras'
        };
        return categories[this.category] || this.category;
    }
}

class FinancialManager {
    constructor() {
        this.transactions = [];
        this.nextId = 1;
        this.categories = {
            'food': 'Alimentação',
            'transport': 'Transporte',
            'housing': 'Moradia',
            'health': 'Saúde',
            'education': 'Educação',
            'entertainment': 'Entretenimento',
            'other': 'Outras'
        };
        this.settings = {
            currency: 'BRL',
            language: 'pt-BR',
            monthlyGoal: 1000,
            showCharts: true
        };
        this.loadFromLocalStorage();
    }

    addTransaction(transaction) {
        transaction.id = this.nextId++;
        this.transactions.push(transaction);
        this.saveToLocalStorage();
        return transaction;
    }

    updateTransaction(updatedTransaction) {
        const index = this.transactions.findIndex(t => t.id === updatedTransaction.id);
        if (index !== -1) {
            this.transactions[index] = updatedTransaction;
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    deleteTransaction(id) {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            this.transactions.splice(index, 1);
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    getTransaction(id) {
        return this.transactions.find(t => t.id === id);
    }

    getTransactions(filters = {}) {
        let filtered = [...this.transactions];
        
        if (filters.category) {
            filtered = filtered.filter(t => t.category === filters.category);
        }
        
        if (filters.type) {
            filtered = filtered.filter(t => t.type === filters.type);
        }
        
        if (filters.startDate) {
            filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.startDate));
        }
        
        if (filters.endDate) {
            filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.endDate));
        }
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(t => 
                t.description.toLowerCase().includes(searchTerm) || 
                t.getCategoryName().toLowerCase().includes(searchTerm) ||
                t.notes.toLowerCase().includes(searchTerm)
            );
        }
        
        // Ordenação
        if (filters.sortBy) {
            filtered.sort((a, b) => {
                if (filters.sortBy === 'date') {
                    return new Date(a.date) - new Date(b.date);
                } else if (filters.sortBy === 'value') {
                    return a.value - b.value;
                } else if (filters.sortBy === 'description') {
                    return a.description.localeCompare(b.description);
                }
                return 0;
            });
            
            if (filters.sortOrder === 'desc') {
                filtered.reverse();
            }
        }
        
        return filtered;
    }

    getBalance() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.value, 0);
        
        const expenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.value, 0);
        
        return income - expenses;
    }

    getTotalIncome() {
        return this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.value, 0);
    }

    getTotalExpenses() {
        return this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.value, 0);
    }
    
    getMonthlyData() {
        const monthlyData = {};
        
        this.transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = {
                    income: 0,
                    expenses: 0,
                    balance: 0
                };
            }
            
            if (transaction.type === 'income') {
                monthlyData[monthYear].income += transaction.value;
                monthlyData[monthYear].balance += transaction.value;
            } else {
                monthlyData[monthYear].expenses += transaction.value;
                monthlyData[monthYear].balance -= transaction.value;
            }
        });
        
        return monthlyData;
    }
    
    getCategoryData() {
        const categoryData = {};
        
        // Inicializar categorias
        Object.keys(this.categories).forEach(category => {
            categoryData[category] = {
                income: 0,
                expenses: 0,
                name: this.categories[category]
            };
        });
        
        // Calcular totais por categoria
        this.transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                categoryData[transaction.category].income += transaction.value;
            } else {
                categoryData[transaction.category].expenses += transaction.value;
            }
        });
        
        return categoryData;
    }
    
    getGoalProgress() {
        const totalExpenses = this.getTotalExpenses();
        const goal = this.settings.monthlyGoal || 1000;
        const progress = Math.min(100, (totalExpenses / goal) * 100);
        
        return {
            progress: progress,
            remaining: goal - totalExpenses,
            goal: goal
        };
    }

    saveToLocalStorage() {
        const data = {
            transactions: this.transactions,
            nextId: this.nextId,
            settings: this.settings
        };
        localStorage.setItem('financialData', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const data = JSON.parse(localStorage.getItem('financialData'));
        if (data) {
            this.transactions = data.transactions.map(t => new Transaction(
                t.id, t.date, t.description, t.category, t.type, t.value, t.notes
            ));
            this.nextId = data.nextId || 1;
            this.settings = data.settings || this.settings;
        } 
    }
    
    exportData(format = 'json') {
        if (format === 'json') {
            const data = {
                transactions: this.transactions,
                settings: this.settings
            };
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            let csv = 'Data,Descrição,Categoria,Tipo,Valor,Observações\n';
            
            this.transactions.forEach(transaction => {
                csv += `"${transaction.getFormattedDate()}","${transaction.description}","${transaction.getCategoryName()}","${transaction.type === 'income' ? 'Receita' : 'Despesa'}","${transaction.value}","${transaction.notes}"\n`;
            });
            
            return csv;
        }
    }
    
    importData(data, format = 'json') {
        try {
            if (format === 'json') {
                const parsedData = JSON.parse(data);
                
                if (parsedData.transactions) {
                    this.transactions = parsedData.transactions.map(t => new Transaction(
                        t.id, t.date, t.description, t.category, t.type, t.value, t.notes
                    ));
                    this.nextId = Math.max(...this.transactions.map(t => t.id), 0) + 1;
                }
                
                if (parsedData.settings) {
                    this.settings = {...this.settings, ...parsedData.settings};
                }
                
                this.saveToLocalStorage();
                return true;
            }
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    }
    
    updateSettings(newSettings) {
        this.settings = {...this.settings, ...newSettings};
        this.saveToLocalStorage();
    }
}

class FinancialUI {
    constructor(financialManager) {
        this.financialManager = financialManager;
        this.currentFilters = {};
        this.editingTransactionId = null;
        this.sortField = 'date';
        this.sortOrder = 'desc';
        
        this.initializeEventListeners();
        this.applyFilters();
        this.initChart();
    }

    initializeEventListeners() {
        // Botões para abrir o modal
        document.getElementById('add-transaction-sidebar').addEventListener('click', () => this.openTransactionModal());
        document.getElementById('add-transaction-table').addEventListener('click', () => this.openTransactionModal());
        
        // Fechar modal
        document.querySelector('.close').addEventListener('click', () => this.closeTransactionModal());
        document.getElementById('cancel-transaction').addEventListener('click', () => this.closeTransactionModal());
        
        // Submissão do formulário
        document.getElementById('transaction-form').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Aplicar filtros
        document.getElementById('apply-filters').addEventListener('click', () => this.applyFilters());
        
        // Fechar modal clicando fora dele
        document.getElementById('transaction-modal').addEventListener('click', (e) => {
            if (e.target.id === 'transaction-modal') {
                this.closeTransactionModal();
            }
        });
        
        // Ordenação da tabela
        document.querySelectorAll('th').forEach(th => {
            th.addEventListener('click', (e) => {
                const field = e.currentTarget.textContent.trim().toLowerCase();
                this.sortTransactions(field);
            });
        });
        
        // Exportar dados
        document.querySelectorAll('.btn')[1].addEventListener('click', () => this.exportData());
        
        // Gerar relatório
        document.querySelectorAll('.btn')[2].addEventListener('click', () => this.generateReport());
    }

    openTransactionModal(transactionId = null) {
        this.editingTransactionId = transactionId;
        const modal = document.getElementById('transaction-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('transaction-form');
        
        if (transactionId) {
            modalTitle.textContent = 'Editar Transação';
            const transaction = this.financialManager.getTransaction(transactionId);
            
            if (transaction) {
                document.getElementById('transaction-date').value = transaction.date;
                document.getElementById('transaction-description').value = transaction.description;
                document.getElementById('transaction-category').value = transaction.category;
                document.getElementById('transaction-type').value = transaction.type;
                document.getElementById('transaction-value').value = transaction.value;
                document.getElementById('transaction-notes').value = transaction.notes;
            }
        } else {
            modalTitle.textContent = 'Nova Transação';
            form.reset();
            document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('transaction-type').value = 'expense';
        }
        
        modal.style.display = 'flex';
    }

    closeTransactionModal() {
        document.getElementById('transaction-modal').style.display = 'none';
        this.editingTransactionId = null;
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const date = document.getElementById('transaction-date').value;
        const description = document.getElementById('transaction-description').value;
        const category = document.getElementById('transaction-category').value;
        const type = document.getElementById('transaction-type').value;
        const value = parseFloat(document.getElementById('transaction-value').value);
        const notes = document.getElementById('transaction-notes').value;
        
        const transaction = new Transaction(
            this.editingTransactionId,
            date,
            description,
            category,
            type,
            value,
            notes
        );
        
        if (this.editingTransactionId) {
            this.financialManager.updateTransaction(transaction);
        } else {
            this.financialManager.addTransaction(transaction);
        }
        
        this.applyFilters();
        this.closeTransactionModal();
    }

    applyFilters() {
        const dateRange = document.getElementById('date-range').value;
        const category = document.getElementById('category').value;
        const type = document.getElementById('type').value;
        
        this.currentFilters = {};
        
        if (category) this.currentFilters.category = category;
        if (type) this.currentFilters.type = type;
        
        // Calcular datas com base no período selecionado
        const today = new Date();
        if (dateRange !== 'custom') {
            const days = parseInt(dateRange);
            if (!isNaN(days)) {
                const startDate = new Date();
                startDate.setDate(today.getDate() - days);
                this.currentFilters.startDate = startDate.toISOString().split('T')[0];
                this.currentFilters.endDate = today.toISOString().split('T')[0];
            }
        }
        
        this.currentFilters.sortBy = this.sortField;
        this.currentFilters.sortOrder = this.sortOrder;
        
        this.renderTransactions();
        this.updateDashboard();
    }
    
    sortTransactions(field) {
        // Mapear nomes de campos para propriedades internas
        const fieldMap = {
            'data': 'date',
            'descrição': 'description',
            'categoria': 'category',
            'valor': 'value'
        };
        
        const internalField = fieldMap[field] || field;
        
        if (this.sortField === internalField) {
            // Alternar ordem se clicar no mesmo campo
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = internalField;
            this.sortOrder = 'asc';
        }
        
        this.applyFilters();
    }

    renderTransactions() {
        const transactions = this.financialManager.getTransactions(this.currentFilters);
        const tbody = document.getElementById('transactions-body');
        
        tbody.innerHTML = '';
        
        if (transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem;">
                        Nenhuma transação encontrada com os filtros atuais.
                    </td>
                </tr>
            `;
            return;
        }
        
        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${transaction.getFormattedDate()}</td>
                <td>${transaction.description}</td>
                <td>${transaction.getCategoryName()}</td>
                <td class="${transaction.type === 'income' ? 'positive' : 'negative'}">${transaction.getFormattedValue()}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${transaction.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${transaction.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Adicionar event listeners para os botões de ação
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                this.openTransactionModal(id);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                if (confirm('Tem certeza que deseja excluir esta transação?')) {
                    this.financialManager.deleteTransaction(id);
                    this.applyFilters();
                }
            });
        });
    }

    updateDashboard() {
        const balance = this.financialManager.getBalance();
        const income = this.financialManager.getTotalIncome();
        const expenses = this.financialManager.getTotalExpenses();
        const goalProgress = this.financialManager.getGoalProgress();
        
        document.getElementById('saldo-atual').textContent = 
            balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        document.getElementById('saldo-atual').className = 
            `value ${balance >= 0 ? 'positive' : 'negative'}`;
        
        document.getElementById('total-receitas').textContent = 
            income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        document.getElementById('total-despesas').textContent = 
            expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        document.getElementById('meta-mensal').textContent = 
            `${goalProgress.progress.toFixed(0)}%`;
        
        document.getElementById('meta-bar').style.width = `${goalProgress.progress}%`;
        
        // Atualizar texto de comparação (simplificado)
        document.querySelectorAll('.card p:nth-child(3)').forEach((el, index) => {
            if (index === 0) {
                el.innerHTML = balance >= 0 ? 
                    '<i class="fas fa-arrow-up"></i> Situação positiva' : 
                    '<i class="fas fa-arrow-down"></i> Situação negativa';
            } else if (index === 1) {
                el.innerHTML = '<i class="fas fa-arrow-up"></i> Bom desempenho';
            } else if (index === 2) {
                const percent = expenses > 0 ? (expenses / income * 100).toFixed(0) : 0;
                el.innerHTML = `<i class="fas fa-arrow-down"></i> ${percent}% das receitas`;
            } else {
                const remaining = goalProgress.remaining > 0 ? 
                    `R$ ${goalProgress.remaining.toFixed(2)} restantes` : 
                    `Excedido em R$ ${Math.abs(goalProgress.remaining).toFixed(2)}`;
                el.textContent = remaining;
            }
        });
    }

    initChart() {
        const ctx = document.getElementById('finance-chart').getContext('2d');
        
        // Dados iniciais do gráfico
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Receitas',
                        data: [],
                        backgroundColor: 'rgba(46, 204, 113, 0.5)',
                        borderColor: 'rgba(46, 204, 113, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Despesas',
                        data: [],
                        backgroundColor: 'rgba(231, 76, 60, 0.5)',
                        borderColor: 'rgba(231, 76, 60, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        this.updateChart();
    }

    updateChart() {
        const monthlyData = this.financialManager.getMonthlyData();
        const months = Object.keys(monthlyData);
        const incomeData = months.map(month => monthlyData[month].income);
        const expenseData = months.map(month => monthlyData[month].expenses);
        
        this.chart.data.labels = months;
        this.chart.data.datasets[0].data = incomeData;
        this.chart.data.datasets[1].data = expenseData;
        this.chart.update();
    }
    
    exportData() {
        const data = this.financialManager.exportData('json');
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'financaspro-backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    generateReport() {
        // Criar um relatório em formato de texto
        const balance = this.financialManager.getBalance();
        const income = this.financialManager.getTotalIncome();
        const expenses = this.financialManager.getTotalExpenses();
        const goalProgress = this.financialManager.getGoalProgress();
        
        const report = `
            RELATÓRIO FINANCEIRO - FinançasPro
            ==================================
            
            Saldo Atual: ${balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            Total de Receitas: ${income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            Total de Despesas: ${expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            
            Meta Mensal: ${goalProgress.progress.toFixed(0)}% concluído
            ${goalProgress.remaining > 0 ? 
                `Valor restante: ${goalProgress.remaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : 
                `Valor excedido: ${Math.abs(goalProgress.remaining).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
            }
            
            Número de transações: ${this.financialManager.transactions.length}
            Período: ${this.currentFilters.startDate || 'Início'} até ${this.currentFilters.endDate || 'Atual'}
        `;
        
        // Abrir relatório em nova janela
        const reportWindow = window.open('', '_blank');
        reportWindow.document.write(`
            <html>
            <head><title>Relatório Financeiro</title></head>
            <body>
                <pre>${report}</pre>
                <button onclick="window.print()">Imprimir Relatório</button>
            </body>
            </html>
        `);
        reportWindow.document.close();
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    const financialManager = new FinancialManager();
    const financialUI = new FinancialUI(financialManager);
    
    // Tornar a UI globalmente acessível para debugging (opcional)
    window.financialUI = financialUI;
    window.financialManager = financialManager;
});