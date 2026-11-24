import{j as e,a as g}from"./index-nkLyd1g7.js";import{a as p,u as Je}from"./vendor-redux-BFBnpc4J.js";import{a1 as De,a3 as Ze,aj as Xe,D as Ye,X as et,y as u,q as tt,ap as st,aq as rt,a9 as he,P as at,k as nt,ak as it,ah as be,am as ke,ad as xe,n as lt,ai as je,m as ot,O as dt,r as ct,w as pt,R as Ae}from"./vendor-ui-DzDAkZp2.js";import{M as pe}from"./Modal-ZhFf3Qcc.js";import{B as ve}from"./Badge-zb7iJdYp.js";import{C as ae}from"./CustomSelect-D1bkkwpi.js";import{C as ut}from"./ConfirmModal-BIGROqc1.js";import{o as mt}from"./razorpay-Dghfs41B.js";import{d as ht,L as ze}from"./vendor-core-DNBG8Rca.js";const xt=N=>{if(N==null||isNaN(N))return"";const k=["","One ","Two ","Three ","Four ","Five ","Six ","Seven ","Eight ","Nine ","Ten ","Eleven ","Twelve ","Thirteen ","Fourteen ","Fifteen ","Sixteen ","Seventeen ","Eighteen ","Nineteen "],o=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"],h=S=>{let I="";const y=Math.floor(S);if(y===0)return"Zero ";const z=Math.floor(y/1e7),P=Math.floor(y%1e7/1e5),V=Math.floor(y%1e5/1e3),Y=Math.floor(y%1e3/100),R=y%100;return z>0&&(I+=h(z)+"Crore "),P>0&&(I+=h(P)+"Lakh "),V>0&&(I+=h(V)+"Thousand "),Y>0&&(I+=h(Y)+"Hundred "),R>0&&(R<20?I+=k[R]:I+=o[Math.floor(R/10)]+(R%10?" "+k[R%10]:" ")),I},A=parseFloat(N),X=Math.floor(A),j=Math.round((A-X)*100);let c=h(X).trim()+" Rupees";return j>0&&(c+=" and "+h(j).trim()+" Paise"),c+=" Only",c.replace(/\s+/g," ")},ft=({isOpen:N,onClose:k,purchase:o,paymentInfo:h=null,isPaymentSuccess:A=!1,suppliers:X=[],warehouses:j=[],tenant:c=null})=>{const S=p.useRef(null);if(!N||!o)return null;const I=o.items||[],y=o.po_number||`PO-${o.id||"2026-0001"}`,z=o.supplier||X.find(f=>f.id===o.supplier_id||f.name===o.supplier_name)||{},P=o.supplier_name||z.name||"Vendor",V=o.supplier_gstin||z.gstin||null,Y=o.supplier_contact||z.phone||z.contact_person||null;z.email;const R=z.address||null,i=j.find(f=>f.id===o.warehouse_id||f.name===o.warehouse_name)||{},F=o.warehouse_name||i.name||"Main Warehouse";i.location||i.address;const E=((c==null?void 0:c.tenantName)||(c==null?void 0:c.companyName)||(c==null?void 0:c.company_name)||(c==null?void 0:c.legalName)||"STOCKPILOT").toUpperCase(),U=(c==null?void 0:c.gstin)||(c==null?void 0:c.tax_number)||null,L=(c==null?void 0:c.phone)||null,ne=(c==null?void 0:c.email)||null,q=(c==null?void 0:c.address)||null,G=parseFloat(o.subtotal||0),$=parseFloat(o.tax_amount||0),ie=parseFloat(o.discount_amount||0),C=parseFloat(o.grand_total||G+$-ie||0),le=h!=null&&h.amount?parseFloat(h.amount):parseFloat(o.paid_amount!==void 0?o.paid_amount:C),M=Math.max(0,C-le),T=M===0||o.payment_status==="PAID"?"PAID":le>0?"PARTIAL":o.payment_status||"UNPAID",we=(h==null?void 0:h.method)||o.payment_method||"BANK",fe=(h==null?void 0:h.transactionId)||o.payment_txn_id||null,ge=o.order_date||o.created_at||Date.now(),oe=new Date(ge).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),v=xt(C),de=()=>{window.print()},b=()=>{window.print()},Q=()=>{const f=`Purchase Order #${y}
Company: ${E}
Supplier: ${P}
Amount: ₹${C.toLocaleString("en-IN",{minimumFractionDigits:2})}
Status: ${T}`;navigator.clipboard&&(navigator.clipboard.writeText(f),u.success("PO voucher summary copied to clipboard"))};return e.jsxs("div",{className:"a4-invoice-overlay",children:[e.jsx("style",{children:`
        .a4-invoice-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 16px 40px;
          overflow-y: auto;
        }

        .a4-toolbar {
          width: 100%;
          max-width: 800px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          color: #ffffff;
        }

        .a4-toolbar-title {
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #f8fafc;
        }

        .a4-toolbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .a4-btn {
          padding: 7px 14px;
          border-radius: 7px;
          font-size: 12.5px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
        }

        .a4-btn:hover {
          background: rgba(255, 255, 255, 0.22);
        }

        .a4-btn.primary {
          background: #982A86;
          border-color: #982A86;
          box-shadow: 0 4px 12px rgba(152, 42, 134, 0.35);
        }

        .a4-btn.primary:hover {
          background: #832072;
        }

        .a4-close-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          padding: 7px;
          border-radius: 7px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .a4-close-btn:hover {
          background: rgba(239, 68, 68, 0.4);
          color: #ffffff;
        }

        /* Clean Corporate A4 Sheet */
        .a4-sheet {
          width: 100%;
          max-width: 800px;
          background: #ffffff;
          color: #0f172a;
          padding: 36px 42px;
          border-radius: 6px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.25);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 12.5px;
          line-height: 1.45;
          box-sizing: border-box;
        }

        /* Top Centered Brand */
        .a4-header-center {
          text-align: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 16px;
          margin-bottom: 16px;
        }

        .a4-logo-img {
          height: 48px;
          max-width: 160px;
          object-fit: contain;
          margin-bottom: 8px;
        }

        .a4-company-name {
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 0.02em;
          margin: 0 0 4px 0;
        }

        .a4-company-meta {
          font-size: 11.5px;
          color: #64748b;
          margin: 0;
        }

        /* Document Header Ribbon */
        .a4-doc-ribbon {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 14px;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .a4-doc-type {
          font-size: 13px;
          font-weight: 800;
          color: #982A86;
          letter-spacing: 0.04em;
        }

        .a4-doc-number {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
        }

        /* 2-Column Info Grid */
        .a4-grid-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          margin-bottom: 18px;
        }

        .a4-grid-cell {
          padding: 12px 16px;
        }

        .a4-grid-cell:first-child {
          border-right: 1px solid #e2e8f0;
        }

        .a4-cell-label {
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 4px;
          display: block;
        }

        .a4-cell-title {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .a4-cell-text {
          font-size: 11.5px;
          color: #475569;
          margin: 2px 0;
        }

        .a4-status-tag {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          background: ${T==="PAID"?"#dcfce7":"#fef3c7"};
          color: ${T==="PAID"?"#15803d":"#b45309"};
          border: 1px solid ${T==="PAID"?"#86efac":"#fde68a"};
        }

        /* Items Table */
        .a4-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #e2e8f0;
          font-size: 12px;
          margin-bottom: 18px;
        }

        .a4-table th {
          background: #f8fafc;
          color: #334155;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          text-align: left;
        }

        .a4-table td {
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          color: #1e293b;
        }

        .a4-table tbody tr:nth-child(even) {
          background: #fafafa;
        }

        /* Totals & Bottom Section */
        .a4-bottom-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          margin-bottom: 24px;
        }

        .a4-bottom-left {
          padding: 14px 16px;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .a4-words-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          border-radius: 4px;
        }

        .a4-words-label {
          font-size: 9.5px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
        }

        .a4-words-value {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 2px;
        }

        .a4-bottom-right {
          padding: 14px 16px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .a4-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #475569;
        }

        .a4-total-row.grand {
          border-top: 1.5px solid #0f172a;
          border-bottom: 1.5px solid #0f172a;
          padding: 6px 0;
          margin: 4px 0;
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
        }

        .a4-total-row.grand .val {
          color: #982A86;
        }

        /* Signatures */
        .a4-signatures {
          display: flex;
          justify-content: space-between;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .a4-sig-block {
          text-align: center;
          width: 180px;
        }

        .a4-sig-space {
          height: 38px;
        }

        .a4-sig-line {
          border-top: 1px solid #0f172a;
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          padding-top: 4px;
        }

        @media print {
          body {
            background: #ffffff !important;
          }
          .a4-toolbar {
            display: none !important;
          }
          .a4-invoice-overlay {
            position: static !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          .a4-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `}),e.jsxs("div",{className:"a4-toolbar",children:[e.jsxs("div",{className:"a4-toolbar-title",children:[e.jsx(De,{size:18,color:"#f472b6"}),e.jsx("span",{children:"Purchase Order Voucher"})]}),e.jsxs("div",{className:"a4-toolbar-actions",children:[e.jsxs("button",{onClick:Q,className:"a4-btn",title:"Copy Details",children:[e.jsx(Ze,{size:13})," Copy"]}),e.jsxs("button",{onClick:de,className:"a4-btn",title:"Print Voucher",children:[e.jsx(Xe,{size:13})," Print"]}),e.jsxs("button",{onClick:b,className:"a4-btn primary",title:"Save PDF",children:[e.jsx(Ye,{size:13})," Save PDF"]}),e.jsx("button",{onClick:k,className:"a4-close-btn",title:"Close",children:e.jsx(et,{size:16})})]})]}),e.jsxs("div",{className:"a4-sheet",ref:S,children:[e.jsxs("div",{className:"a4-header-center",children:[e.jsx("div",{children:e.jsx("img",{src:"/logo.png",alt:"Logo",className:"a4-logo-img",onError:f=>{f.currentTarget.style.display="none"}})}),e.jsx("h1",{className:"a4-company-name",children:E}),e.jsxs("p",{className:"a4-company-meta",children:[q&&e.jsxs("span",{children:[q," • "]}),U&&e.jsxs("span",{children:["GSTIN: ",U," • "]}),L&&e.jsxs("span",{children:["Phone: ",L," • "]}),ne&&e.jsxs("span",{children:["Email: ",ne]}),!q&&!U&&!L&&e.jsx("span",{children:"Procurement & Inventory Management System"})]})]}),e.jsxs("div",{className:"a4-doc-ribbon",children:[e.jsx("div",{className:"a4-doc-type",children:"PURCHASE ORDER VOUCHER"}),e.jsxs("div",{className:"a4-doc-number",children:["#",y]})]}),e.jsxs("div",{className:"a4-grid-info",children:[e.jsxs("div",{className:"a4-grid-cell",children:[e.jsx("span",{className:"a4-cell-label",children:"SUPPLIER / VENDOR"}),e.jsx("div",{className:"a4-cell-title",children:P}),Y&&e.jsxs("div",{className:"a4-cell-text",children:[e.jsx("strong",{children:"Phone:"})," ",Y]}),V&&e.jsxs("div",{className:"a4-cell-text",children:[e.jsx("strong",{children:"GSTIN:"})," ",V]}),R&&e.jsx("div",{className:"a4-cell-text",children:R})]}),e.jsxs("div",{className:"a4-grid-cell",children:[e.jsx("span",{className:"a4-cell-label",children:"ORDER PARTICULARS"}),e.jsxs("div",{className:"a4-cell-text",children:[e.jsx("strong",{children:"Date:"})," ",oe]}),e.jsxs("div",{className:"a4-cell-text",children:[e.jsx("strong",{children:"Warehouse:"})," ",F]}),e.jsxs("div",{className:"a4-cell-text",children:[e.jsx("strong",{children:"Payment:"})," ",we]}),fe&&e.jsxs("div",{className:"a4-cell-text",children:[e.jsx("strong",{children:"Txn ID:"})," ",fe]}),e.jsx("div",{style:{marginTop:"6px"},children:e.jsx("span",{className:"a4-status-tag",children:T})})]})]}),e.jsxs("table",{className:"a4-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:"36px",textAlign:"center"},children:"#"}),e.jsx("th",{children:"Item Description"}),e.jsx("th",{style:{width:"60px",textAlign:"center"},children:"Qty"}),e.jsx("th",{style:{width:"100px",textAlign:"right"},children:"Unit Price"}),e.jsx("th",{style:{width:"70px",textAlign:"right"},children:"Tax"}),e.jsx("th",{style:{width:"110px",textAlign:"right"},children:"Total (₹)"})]})}),e.jsx("tbody",{children:I.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:6,style:{textAlign:"center",padding:"20px",color:"#94a3b8"},children:"No items in this purchase order."})}):I.map((f,O)=>{const ue=parseFloat(f.unit_price||0),H=parseInt(f.quantity,10)||1,ce=parseFloat(f.tax_rate||0),ee=parseFloat(f.total_price||ue*H*(1+ce/100));return e.jsxs("tr",{children:[e.jsx("td",{style:{textAlign:"center",fontWeight:600},children:O+1}),e.jsxs("td",{children:[e.jsx("div",{style:{fontWeight:700,color:"#0f172a"},children:f.product_name}),f.product_code&&e.jsxs("div",{style:{fontSize:"10.5px",color:"#64748b"},children:["SKU: ",f.product_code]})]}),e.jsx("td",{style:{textAlign:"center",fontWeight:600},children:H}),e.jsxs("td",{style:{textAlign:"right"},children:["₹",ue.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})]}),e.jsx("td",{style:{textAlign:"right",color:"#475569"},children:ce>0?`${ce}%`:"0%"}),e.jsxs("td",{style:{textAlign:"right",fontWeight:700,color:"#0f172a"},children:["₹",ee.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})]})]},O)})})]}),e.jsxs("div",{className:"a4-bottom-grid",children:[e.jsxs("div",{className:"a4-bottom-left",children:[e.jsxs("div",{className:"a4-words-box",children:[e.jsx("span",{className:"a4-words-label",children:"Amount in Words:"}),e.jsxs("div",{className:"a4-words-value",children:["INR ",v||"Zero Rupees Only"]})]}),e.jsx("div",{style:{fontSize:"10px",color:"#94a3b8",marginTop:"10px"},children:"* This is a computer generated purchase order record."})]}),e.jsxs("div",{className:"a4-bottom-right",children:[e.jsxs("div",{className:"a4-total-row",children:[e.jsx("span",{children:"Subtotal:"}),e.jsxs("span",{style:{fontWeight:600,color:"#0f172a"},children:["₹",G.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})]})]}),$>0&&e.jsxs("div",{className:"a4-total-row",children:[e.jsx("span",{children:"GST / Tax:"}),e.jsxs("span",{style:{fontWeight:600,color:"#0f172a"},children:["₹",$.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})]})]}),ie>0&&e.jsxs("div",{className:"a4-total-row",style:{color:"#16a34a"},children:[e.jsx("span",{children:"Discount:"}),e.jsxs("span",{children:["-₹",ie.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})]})]}),e.jsxs("div",{className:"a4-total-row grand",children:[e.jsx("span",{children:"Grand Total:"}),e.jsxs("span",{className:"val",children:["₹",C.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})]})]}),e.jsxs("div",{className:"a4-total-row",children:[e.jsx("span",{children:"Paid Amount:"}),e.jsxs("span",{style:{fontWeight:600,color:"#16a34a"},children:["₹",le.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})]})]}),M>0&&e.jsxs("div",{className:"a4-total-row",style:{color:"#dc2626",fontWeight:700},children:[e.jsx("span",{children:"Balance Due:"}),e.jsxs("span",{children:["₹",M.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})]})]})]})]}),e.jsxs("div",{className:"a4-signatures",children:[e.jsxs("div",{className:"a4-sig-block",children:[e.jsx("div",{className:"a4-sig-space"}),e.jsx("div",{className:"a4-sig-line",children:"Receiver's Signature"})]}),e.jsxs("div",{className:"a4-sig-block",children:[e.jsx("div",{className:"a4-sig-space"}),e.jsx("div",{className:"a4-sig-line",children:"Authorized Signatory"})]})]})]})]})};function Pt(){var Ce;const{user:N}=Je(t=>t.auth),[k]=ht(),[o,h]=p.useState("purchases"),[A,X]=p.useState([]),[j,c]=p.useState([]),[S,I]=p.useState([]),[y,z]=p.useState([]),[P,V]=p.useState([]),[Y,R]=p.useState(!0),[i,F]=p.useState(null),[Se,E]=p.useState(!1),[U,L]=p.useState(""),[ne,q]=p.useState(!1),[G,$]=p.useState(!1),[ie,C]=p.useState(!1),[le,M]=p.useState(!1),[Ne,T]=p.useState(!1),[we,fe]=p.useState(null),[ge,oe]=p.useState(!1),[v,de]=p.useState(null),[b,Q]=p.useState({amount:"",paymentMethod:"BANK_TRANSFER",transactionId:"",notes:"",autoApproveStock:!0}),[f,O]=p.useState(null),[ue,H]=p.useState(!1),[ce,ee]=p.useState(null),[_e,me]=p.useState(!1),[w,K]=p.useState({isOpen:!1,type:"",id:null,title:"",message:"",itemName:"",loading:!1}),[x,J]=p.useState({supplierId:"",warehouseId:"",notes:"",discountAmount:0,items:[{productId:"",quantity:1,unitPrice:"",taxRate:0}]}),[D,te]=p.useState({name:"",contactPerson:"",email:"",phone:"",address:"",gstin:""}),[m,Z]=p.useState({purchaseId:null,poNumber:"",supplierId:"",warehouseId:"",warehouseName:"",reason:"Defective goods on inspection",notes:"",items:[]}),W=async()=>{try{R(!0);const[t,s,r,a,n]=await Promise.all([g.get("/purchases"),g.get("/suppliers"),g.get("/warehouses"),g.get("/products?limit=100"),g.get("/purchase-returns").catch(()=>({data:[]}))]);X((t==null?void 0:t.data)||[]),c((s==null?void 0:s.data)||[]),I((r==null?void 0:r.data)||[]),z((a==null?void 0:a.data)||[]),V((n==null?void 0:n.data)||[])}catch(t){console.error("Error fetching purchasing data:",t)}finally{R(!1)}};p.useEffect(()=>{W()},[]),p.useEffect(()=>{var l,d;const t=k.get("tab");t&&["purchases","suppliers","returns"].includes(t)&&h(t);const s=k.get("returnId");if(s&&P.length>0){const B=P.find(se=>String(se.id)===String(s));B&&(F(B),E(!0))}const r=k.get("action"),a=k.get("new"),n=k.get("productId");if(r==="new"||a==="true"){h("purchases"),C(!0);const B=N!=null&&N.warehouseId?String(N.warehouseId):(l=S[0])!=null&&l.id?String(S[0].id):"",se=(d=j[0])!=null&&d.id?String(j[0].id):"",_=n&&y.length>0?y.find(re=>String(re.id)===String(n)):null;J(re=>({...re,supplierId:re.supplierId||se,warehouseId:re.warehouseId||B,items:_?[{productId:String(_.id),quantity:Math.max(1,(_.minimum_stock||5)*2),unitPrice:_.purchase_price!==void 0&&_.purchase_price!==null?_.purchase_price:0,taxRate:_.tax_rate!==void 0&&_.tax_rate!==null?_.tax_rate:18}]:re.items}))}},[k,P,y,S,j,N]);const Te=()=>{J({...x,items:[...x.items,{productId:"",quantity:1,unitPrice:"",taxRate:0}]})},Oe=t=>{const s=x.items.filter((r,a)=>a!==t);J({...x,items:s})},Ie=(t,s,r)=>{const a=[...x.items];if(a[t][s]=r,s==="productId"){const n=y.find(l=>l.id===parseInt(r,10));n&&(a[t].unitPrice=n.purchase_price!==void 0&&n.purchase_price!==null?n.purchase_price:0,a[t].taxRate=n.tax_rate!==void 0&&n.tax_rate!==null?n.tax_rate:18)}J({...x,items:a})},ye=()=>{let t=0,s=0;x.items.forEach(n=>{const l=parseInt(n.quantity,10)||0,d=parseFloat(n.unitPrice)||0,B=parseFloat(n.taxRate)||0,se=l*d,_=se*(B/100);t+=se,s+=_});const r=parseFloat(x.discountAmount)||0,a=Math.max(0,t+s-r);return{subtotal:t,taxTotal:s,discount:r,grandTotal:a}},We=async t=>{var s;t.preventDefault();try{if(!x.supplierId){u.warning("Please select a Supplier for this purchase order");return}if(!x.warehouseId&&S.length>0){u.warning("Please select a destination Warehouse");return}const r=x.items.filter(l=>l.productId&&parseInt(l.quantity,10)>0);if(r.length===0){u.warning("Please select at least one Product item with a valid quantity");return}const a=parseInt(x.warehouseId,10)||((s=S[0])==null?void 0:s.id)||1,n=S.find(l=>l.id===a);await g.post("/purchases",{supplierId:parseInt(x.supplierId,10),warehouseId:a,warehouseName:n?n.name:"Main Warehouse",discountAmount:parseFloat(x.discountAmount)||0,notes:x.notes||"",items:r.map(l=>{const d=y.find(B=>B.id===parseInt(l.productId,10));return{productId:parseInt(l.productId,10),productCode:d?d.product_code:`PRD-${l.productId}`,productName:d?d.name:`Product ${l.productId}`,quantity:parseInt(l.quantity,10),unitPrice:parseFloat(l.unitPrice)||0,taxRate:parseFloat(l.taxRate)||0}})}),u.success("Purchase Order created successfully"),C(!1),W()}catch(r){u.error(r.message||"Failed to create Purchase Order")}},Fe=async t=>{try{await g.patch(`/purchases/${t}/approve`),u.success("Purchase Order approved & inventory updated"),W()}catch(s){u.error(s.message||"Failed to approve purchase")}},Ee=t=>{K({isOpen:!0,type:"po",id:t.id,title:"Delete Purchase Order?",message:"Are you sure you want to remove this purchase order record?",itemName:`${t.po_number||"PO"} • ${t.supplier_name||"Supplier"}`,loading:!1})},qe=t=>{K({isOpen:!0,type:"supplier",id:t.id,title:"Delete Supplier?",message:"Are you sure you want to delete this supplier profile?",itemName:t.name,loading:!1})},Me=async()=>{if(w.id){K(t=>({...t,loading:!0}));try{w.type==="po"?(await g.delete(`/purchases/${w.id}`),u.success("Purchase order deleted successfully")):w.type==="supplier"?(await g.delete(`/suppliers/${w.id}`),u.success("Supplier deleted successfully")):w.type==="return"&&(await g.delete(`/purchase-returns/${w.id}`),u.success("Purchase return deleted & stock restored to live inventory successfully")),K({isOpen:!1,type:"",id:null,title:"",message:"",itemName:"",loading:!1}),W()}catch(t){u.error(t.message||"Failed to delete"),K(s=>({...s,loading:!1}))}}},Le=async t=>{var s;if(t.payment_status!=="PAID"){u.warn("Please complete the payment first to generate and download the Tax Invoice.");return}try{const r=await g.get(`/purchases/${t.id}`);O(((s=r.data)==null?void 0:s.data)||t)}catch{O(t)}ee(null),me(!1),H(!0)},$e=async t=>{const s=parseFloat(t.due_amount||t.grand_total||0);let r=(localStorage.getItem("stockpilot_rzp_key")||"").trim();(!r||r==="rzp_test_51b7Z0wZ4N3F8C")&&(r="rzp_test_TZszoYWU51JmHM",localStorage.setItem("stockpilot_rzp_key",r));try{await mt({key:r.trim(),amount:s,poNumber:t.po_number,supplierName:t.supplier_name,companyName:"StockPilot",onSuccess:async a=>{var l;const n=a.razorpay_payment_id||`pay_${Date.now()}`;try{await g.post(`/purchases/${t.id}/payments`,{amount:s,paymentMethod:"RAZORPAY",transactionId:n,notes:`Paid via Razorpay (Payment ID: ${n})`,autoApproveStock:!0}),u.success(`Payment verified via Razorpay! ID: ${n}`),W();try{const d=await g.get(`/purchases/${t.id}`);O(((l=d.data)==null?void 0:l.data)||t)}catch{O({...t,paid_amount:s,due_amount:0,payment_status:"PAID"})}ee({transactionId:n,amount:s,date:new Date}),me(!0),H(!0)}catch(d){u.error(d.message||"Payment recording failed")}},onDismiss:a=>{a&&(a.code==="BAD_REQUEST_ERROR"||String(a.description||"").includes("Unauthorized"))?u.error("Invalid Razorpay Key. Please update your Key ID in Settings or try again."):u.info("Payment window closed")}})}catch(a){u.error(a.message||"Failed to launch Razorpay Checkout")}},Be=async t=>{var a;if(t.preventDefault(),!v)return;const s=parseFloat(b.amount||0),r=b.transactionId||`TXN-${Date.now()}`;try{await g.post(`/purchases/${v.id}/payments`,{amount:s,paymentMethod:b.paymentMethod,transactionId:r,notes:b.notes,autoApproveStock:b.autoApproveStock}),u.success("Payment recorded successfully!"),oe(!1),W();try{const n=await g.get(`/purchases/${v.id}`);O(((a=n.data)==null?void 0:a.data)||v)}catch{O(v)}ee({transactionId:r,amount:s,date:new Date}),me(!0),H(!0),de(null)}catch(n){u.error(n.message||"Failed to record payment")}},Ve=async t=>{t.preventDefault();try{await g.post("/suppliers",D),u.success("Supplier created successfully"),M(!1),te({name:"",contactPerson:"",email:"",phone:"",address:"",gstin:""}),W()}catch(s){u.error(s.message||"Failed to create supplier")}},Pe=(t=null)=>{const s=t||A.find(r=>r.status==="APPROVED"||r.payment_status==="PAID")||A[0];Z(s?{purchaseId:String(s.id),poNumber:s.po_number,supplierId:String(s.supplier_id),warehouseId:String(s.warehouse_id),warehouseName:s.warehouse_name,reason:"Defective / Damaged items on delivery",notes:"",items:(s.items||[]).map(r=>({productId:r.product_id,productCode:r.product_code,productName:r.product_name,purchasedQty:r.quantity,quantity:1,unitPrice:r.unit_price,selected:!0}))}:{purchaseId:"",poNumber:"",supplierId:"",warehouseId:"",warehouseName:"",reason:"Defective / Damaged items on delivery",notes:"",items:[]}),T(!0)},Ue=t=>{if(!t){Z(r=>({...r,purchaseId:"",poNumber:"",supplierId:"",warehouseId:"",warehouseName:"",items:[]}));return}const s=A.find(r=>String(r.id)===String(t));s&&Z(r=>({...r,purchaseId:String(s.id),poNumber:s.po_number,supplierId:String(s.supplier_id),warehouseId:String(s.warehouse_id),warehouseName:s.warehouse_name,items:(s.items||[]).map(a=>({productId:a.product_id,productCode:a.product_code,productName:a.product_name,purchasedQty:a.quantity,quantity:1,unitPrice:a.unit_price,selected:!0}))}))},Re=(t,s,r)=>{const a=[...m.items];a[t][s]=r,Z(n=>({...n,items:a}))},Ge=t=>{K({isOpen:!0,type:"return",id:t.id,title:"Delete Purchase Return?",message:"Are you sure you want to delete this purchase return record? Deleting this return will automatically restore the returned items back into warehouse live stock.",itemName:`${t.return_number||"Return"} • ${t.supplier_name||"Supplier"} (Refund: ₹${parseFloat(t.total_refund||0).toLocaleString()})`,loading:!1})},Qe=async t=>{var s,r;t.preventDefault();try{const a=(m.items||[]).filter(d=>d.selected!==!1).map(d=>({productId:parseInt(d.productId,10),productCode:d.productCode||"",productName:d.productName||"",quantity:parseInt(d.quantity,10),unitPrice:parseFloat(d.unitPrice)||0})).filter(d=>d.quantity>0);if(a.length===0){u.error("Please specify at least one product with return quantity greater than 0");return}const n=S.find(d=>d.id===parseInt(m.warehouseId,10)),l=await g.post("/purchase-returns",{purchaseId:m.purchaseId?parseInt(m.purchaseId,10):null,supplierId:parseInt(m.supplierId,10),warehouseId:parseInt(m.warehouseId,10),warehouseName:n?n.name:m.warehouseName||"Main Warehouse",reason:m.reason,notes:m.notes,items:a});u.success("RMA Return Request logged! Awaiting supplier / manager acceptance."),T(!1),h("returns"),W(),l!=null&&l.data&&F(l.data)}catch(a){u.error(((r=(s=a.response)==null?void 0:s.data)==null?void 0:r.message)||a.message||"Failed to process purchase return")}},He=async t=>{var s,r;try{$(!0),await g.patch(`/purchase-returns/${t}/approve`),u.success("Return request accepted! Warehouse live stock deducted successfully."),E(!1),F(null),W()}catch(a){u.error(((r=(s=a.response)==null?void 0:s.data)==null?void 0:r.message)||a.message||"Failed to approve return request")}finally{$(!1)}},Ke=async t=>{var s,r;if(!U.trim()){u.warning("Please specify a reason for declining the return request");return}try{$(!0),await g.patch(`/purchase-returns/${t}/reject`,{rejectionReason:U.trim()}),u.info("Return request declined. Warehouse live stock remains unaffected."),E(!1),F(null),L(""),q(!1),W()}catch(a){u.error(((r=(s=a.response)==null?void 0:s.data)==null?void 0:r.message)||a.message||"Failed to decline return request")}finally{$(!1)}};return e.jsxs("div",{children:[e.jsxs("div",{className:"page-header",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"page-title",children:"Purchasing & Suppliers"}),e.jsx("p",{className:"page-subtitle",children:"Manage procurement orders, supplier accounts, and purchase returns"})]}),e.jsxs("div",{style:{display:"flex",gap:"0.65rem",flexWrap:"wrap",alignItems:"center"},children:[e.jsxs("div",{className:"segmented-control",children:[e.jsxs("button",{onClick:()=>h("purchases"),className:`segmented-tab ${o==="purchases"?"active":""}`,children:[e.jsx(tt,{size:15})," Purchase Orders (",A.length,")"]}),e.jsxs("button",{onClick:()=>h("suppliers"),className:`segmented-tab ${o==="suppliers"?"active":""}`,children:[e.jsx(st,{size:15})," Suppliers (",j.length,")"]}),e.jsxs("button",{onClick:()=>h("returns"),className:`segmented-tab ${o==="returns"?"active":""}`,children:[e.jsx(rt,{size:15})," Purchase Returns (",P.length,")"]})]}),e.jsxs("button",{onClick:()=>{var t,s;J({supplierId:(t=j[0])!=null&&t.id?String(j[0].id):"",warehouseId:(s=S[0])!=null&&s.id?String(S[0].id):"",notes:"",discountAmount:0,items:[{productId:"",quantity:1,unitPrice:"",taxRate:0}]}),C(!0)},className:"btn btn-primary btn-sm",children:[e.jsx(he,{size:14})," New Purchase Order"]})]})]}),o==="purchases"&&e.jsxs(e.Fragment,{children:[y.length===0&&e.jsxs("div",{style:{background:"rgba(59, 130, 246, 0.08)",border:"1px solid rgba(59, 130, 246, 0.25)",borderRadius:"10px",padding:"0.85rem 1.25rem",marginBottom:"1rem",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"1rem"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"10px"},children:[e.jsx(at,{size:22,color:"#3b82f6",style:{flexShrink:0}}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.875rem",fontWeight:700,color:"#1e40af"},children:"Your Product Catalog is Empty"}),e.jsx("div",{style:{fontSize:"0.8rem",color:"#3b82f6"},children:"To create purchase orders and procure inventory, define your products in the Products page first."})]})]}),e.jsxs(ze,{to:"/products",className:"btn btn-primary btn-sm",style:{whiteSpace:"nowrap",textDecoration:"none"},children:[e.jsx(he,{size:13})," Go to Products Catalog"]})]}),e.jsx("div",{className:"card",style:{padding:0,overflow:"hidden"},children:e.jsx("div",{className:"table-container",style:{border:"none"},children:e.jsxs("table",{className:"data-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"PO Number"}),e.jsx("th",{children:"Supplier"}),e.jsx("th",{children:"Warehouse"}),e.jsx("th",{children:"Order Items"}),e.jsx("th",{children:"Grand Total"}),e.jsx("th",{children:"Payment"}),e.jsx("th",{children:"Status"}),e.jsx("th",{style:{textAlign:"right"},children:"Actions"})]})}),e.jsx("tbody",{children:A.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:8,style:{textAlign:"center",padding:"2rem",color:"var(--text-muted)"},children:'No purchase orders found. Click "New Purchase Order" to procure stock!'})}):A.map(t=>e.jsxs("tr",{children:[e.jsx("td",{style:{fontWeight:700,color:"var(--primary)"},children:t.po_number}),e.jsx("td",{children:e.jsx("div",{style:{fontWeight:600},children:t.supplier_name})}),e.jsx("td",{children:t.warehouse_name}),e.jsx("td",{children:e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"4px"},children:(t.items||[]).map((s,r)=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"6px",whiteSpace:"nowrap"},children:[e.jsx("span",{style:{fontWeight:600,color:"var(--text-primary)",fontSize:"0.85rem"},children:s.product_name}),e.jsxs("span",{style:{fontSize:"0.72rem",fontWeight:600,color:"var(--primary)",background:"rgba(152, 42, 134, 0.08)",border:"1px solid rgba(152, 42, 134, 0.2)",padding:"1px 6px",borderRadius:"4px"},children:["Qty: ",s.quantity]})]},r))})}),e.jsxs("td",{style:{fontWeight:800},children:["₹",parseFloat(t.grand_total).toLocaleString()]}),e.jsx("td",{children:e.jsx(ve,{status:t.payment_status})}),e.jsx("td",{children:e.jsx(ve,{status:t.status})}),e.jsx("td",{style:{textAlign:"right"},children:e.jsxs("div",{style:{display:"flex",gap:"6px",justifyContent:"flex-end",alignItems:"center",flexWrap:"nowrap"},children:[t.payment_status==="PAID"&&e.jsxs("button",{onClick:()=>Le(t),className:"btn btn-secondary btn-sm",style:{display:"inline-flex",alignItems:"center",gap:"4px",padding:"0.35rem 0.65rem",fontSize:"0.75rem",fontWeight:600,whiteSpace:"nowrap",flexShrink:0},title:"View & Download Official Tax Invoice",children:[e.jsx(De,{size:13,color:"var(--primary)"})," Invoice"]}),t.payment_status!=="PAID"&&e.jsxs("button",{onClick:()=>$e(t),className:"btn btn-primary btn-sm",style:{display:"inline-flex",alignItems:"center",gap:"5px",padding:"0.35rem 0.75rem",whiteSpace:"nowrap",flexShrink:0},title:"Pay with Razorpay Gateway",children:[e.jsx(nt,{size:13})," Pay Now"]}),t.status==="DRAFT"||t.status==="PENDING_APPROVAL"?e.jsxs("button",{onClick:()=>Fe(t.id),className:"btn btn-success btn-sm",style:{display:"inline-flex",alignItems:"center",gap:"5px",padding:"0.35rem 0.75rem",whiteSpace:"nowrap",flexShrink:0},title:"Approve & Increase Stock",children:[e.jsx(it,{size:14})," Intake Stock"]}):e.jsxs("span",{style:{color:"var(--success)",fontWeight:700,fontSize:"0.8rem",display:"inline-flex",alignItems:"center",gap:"4px",whiteSpace:"nowrap",flexShrink:0},children:[e.jsx(be,{size:13})," Stock Added"]}),t.status==="APPROVED"&&e.jsxs("button",{onClick:()=>Pe(t),className:"btn btn-secondary btn-sm",style:{display:"inline-flex",alignItems:"center",gap:"4px",padding:"0.35rem 0.65rem",fontSize:"0.75rem",fontWeight:600,whiteSpace:"nowrap",flexShrink:0},title:"Initiate Purchase Return / RTV",children:[e.jsx(ke,{size:13,color:"#ef4444"})," Return"]}),e.jsx("button",{onClick:()=>Ee(t),className:"btn btn-danger btn-sm",style:{padding:"0.35rem 0.45rem",flexShrink:0},title:"Delete Purchase Order",children:e.jsx(xe,{size:13})})]})})]},t.id))})]})})})]}),o==="suppliers"&&e.jsxs("div",{children:[e.jsx("div",{style:{display:"flex",justifyContent:"flex-end",marginBottom:"1rem"},children:e.jsxs("button",{onClick:()=>M(!0),className:"btn btn-primary btn-sm",children:[e.jsx(he,{size:14})," Add New Supplier"]})}),e.jsx("div",{className:"card",style:{padding:0,overflow:"hidden"},children:e.jsx("div",{className:"table-container",style:{border:"none"},children:e.jsxs("table",{className:"data-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Supplier / Company"}),e.jsx("th",{children:"Contact Person"}),e.jsx("th",{children:"Phone"}),e.jsx("th",{children:"Email"}),e.jsx("th",{children:"GSTIN"}),e.jsx("th",{children:"Status"}),e.jsx("th",{style:{textAlign:"right"},children:"Action"})]})}),e.jsx("tbody",{children:j.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:7,style:{textAlign:"center",padding:"2rem",color:"var(--text-muted)"},children:'No suppliers registered. Click "Add New Supplier" to add one!'})}):j.map(t=>e.jsxs("tr",{children:[e.jsx("td",{style:{fontWeight:700},children:t.name}),e.jsx("td",{children:t.contact_person||"—"}),e.jsx("td",{children:t.phone}),e.jsx("td",{children:t.email||"—"}),e.jsx("td",{children:e.jsx("code",{children:t.gstin||"—"})}),e.jsx("td",{children:e.jsx(ve,{status:t.status})}),e.jsx("td",{style:{textAlign:"right"},children:e.jsx("button",{onClick:()=>qe(t),className:"btn btn-danger btn-sm",style:{padding:"0.25rem 0.45rem",fontSize:"0.75rem"},title:"Delete Supplier",children:e.jsx(xe,{size:13})})})]},t.id))})]})})})]}),o==="returns"&&e.jsxs("div",{children:[e.jsx("div",{style:{display:"flex",justifyContent:"flex-end",marginBottom:"1rem"},children:e.jsxs("button",{onClick:Pe,className:"btn btn-danger btn-sm",style:{display:"inline-flex",alignItems:"center",gap:"6px"},children:[e.jsx(ke,{size:14})," Process Purchase Return"]})}),e.jsx("div",{className:"card",style:{padding:0,overflow:"hidden"},children:e.jsx("div",{className:"table-container",style:{border:"none"},children:e.jsxs("table",{className:"data-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Return #"}),e.jsx("th",{children:"Linked PO"}),e.jsx("th",{children:"Supplier"}),e.jsx("th",{children:"Warehouse"}),e.jsx("th",{children:"Items Returned"}),e.jsx("th",{children:"Refund Value"}),e.jsx("th",{children:"Reason"}),e.jsx("th",{children:"RMA Status"}),e.jsx("th",{children:"Date"}),e.jsx("th",{style:{textAlign:"right"},children:"Actions"})]})}),e.jsx("tbody",{children:P.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:10,style:{textAlign:"center",padding:"2.5rem",color:"var(--text-muted)"},children:'No purchase returns recorded yet. Click "Process Purchase Return" to submit an RMA return request.'})}):P.map(t=>{const s=!t.status||t.status==="PENDING_APPROVAL",r=t.status==="APPROVED",a=t.status==="REJECTED";return e.jsxs("tr",{style:{background:s?"#fffdf7":"transparent"},children:[e.jsx("td",{style:{fontWeight:700,color:r?"var(--success)":s?"#d97706":"#ef4444"},children:t.return_number}),e.jsx("td",{children:t.purchase_id?e.jsxs("span",{style:{fontWeight:600,color:"var(--primary)",fontFamily:"monospace",fontSize:"0.8rem"},children:["PO #",t.purchase_id]}):e.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.8rem"},children:"Direct Return"})}),e.jsx("td",{children:e.jsx("div",{style:{fontWeight:600},children:t.supplier_name})}),e.jsx("td",{children:t.warehouse_name}),e.jsx("td",{children:e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"3px"},children:(t.items||[]).map((n,l)=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"6px"},children:[e.jsx("span",{style:{fontWeight:600,color:"var(--text-primary)",fontSize:"0.85rem"},children:n.product_name}),e.jsxs("span",{style:{fontSize:"0.72rem",fontWeight:600,color:"#dc2626",background:"rgba(239, 68, 68, 0.08)",border:"1px solid rgba(239, 68, 68, 0.2)",padding:"1px 6px",borderRadius:"4px"},children:["-",n.quantity," qty"]})]},l))})}),e.jsxs("td",{style:{fontWeight:800,color:"#0f172a"},children:["₹",parseFloat(t.total_refund||0).toLocaleString()]}),e.jsx("td",{style:{fontSize:"0.85rem",color:"var(--text-secondary)"},children:t.reason}),e.jsxs("td",{children:[r&&e.jsxs("span",{style:{display:"inline-flex",alignItems:"center",gap:"4px",padding:"0.2rem 0.6rem",borderRadius:"6px",fontSize:"0.725rem",fontWeight:700,background:"#ecfdf5",color:"#047857",border:"1px solid #a7f3d0"},children:[e.jsx(be,{size:12})," Accepted (Deducted)"]}),s&&e.jsxs("span",{style:{display:"inline-flex",alignItems:"center",gap:"4px",padding:"0.2rem 0.6rem",borderRadius:"6px",fontSize:"0.725rem",fontWeight:700,background:"#fffbeb",color:"#b45309",border:"1px solid #fde68a"},children:[e.jsx(lt,{size:12})," Awaiting Review"]}),a&&e.jsxs("span",{style:{display:"inline-flex",alignItems:"center",gap:"4px",padding:"0.2rem 0.6rem",borderRadius:"6px",fontSize:"0.725rem",fontWeight:700,background:"#fef2f2",color:"#b91c1c",border:"1px solid #fecaca"},title:t.rejection_reason||"Declined",children:[e.jsx(je,{size:12})," Declined"]})]}),e.jsx("td",{style:{fontSize:"0.78rem",color:"var(--text-muted)",whiteSpace:"nowrap"},children:new Date(t.created_at||t.createdAt).toLocaleDateString()}),e.jsx("td",{style:{textAlign:"right"},children:e.jsxs("div",{style:{display:"flex",gap:"5px",justifyContent:"flex-end",alignItems:"center"},children:[e.jsxs("button",{onClick:()=>{F(t),E(!0),q(!1),L("")},className:`btn btn-sm ${s?"btn-primary":"btn-secondary"}`,style:{display:"inline-flex",alignItems:"center",gap:"4px",padding:"0.28rem 0.6rem",fontSize:"0.75rem",fontWeight:600},title:"Review / Inspect Return Request",children:[s?e.jsx(ot,{size:13}):e.jsx(dt,{size:13}),s?"Review & Act":"Details"]}),e.jsx("button",{onClick:()=>Ge(t),className:"btn btn-danger btn-sm",style:{padding:"0.28rem 0.45rem",fontSize:"0.75rem"},title:"Delete Return Record",children:e.jsx(xe,{size:13})})]})})]},t.id)})})]})})})]}),e.jsx(pe,{isOpen:ie,onClose:()=>C(!1),title:"Create Purchase Order",maxWidth:"820px",children:e.jsxs("form",{onSubmit:We,children:[e.jsxs("div",{className:"form-row",children:[e.jsxs("div",{className:"form-group",children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"},children:[e.jsx("label",{className:"form-label",style:{margin:0},children:"Select Supplier *"}),j.length===0&&e.jsx("button",{type:"button",onClick:()=>{C(!1),M(!0)},style:{background:"none",border:"none",color:"var(--primary)",fontSize:"0.75rem",fontWeight:600,cursor:"pointer",padding:0},children:"+ Add Supplier"})]}),e.jsx(ae,{value:x.supplierId,onChange:t=>J({...x,supplierId:t.target.value}),placeholder:"Select Supplier",options:[{value:"",label:"Select Supplier"},...j.map(t=>({value:t.id,label:`${t.name} (${t.phone||"No phone"})`}))]})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",children:"Receiving Warehouse *"}),e.jsx(ae,{value:x.warehouseId,onChange:t=>J({...x,warehouseId:t.target.value}),placeholder:"Select Receiving Warehouse",options:[{value:"",label:"Select Receiving Warehouse"},...S.map(t=>({value:t.id,label:`${t.name} (${t.code})`}))]})]})]}),y.length===0&&e.jsxs("div",{style:{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:"8px",padding:"0.75rem 1rem",marginTop:"0.75rem",marginBottom:"0.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.75rem"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[e.jsx(ct,{size:18,color:"#2563eb",style:{flexShrink:0}}),e.jsxs("span",{style:{fontSize:"0.8rem",color:"#1e40af"},children:[e.jsx("strong",{children:"Product Catalog is empty:"})," Add products to your catalog first before procuring them."]})]}),e.jsx(ze,{to:"/products",className:"btn btn-primary btn-sm",style:{whiteSpace:"nowrap",textDecoration:"none"},children:"+ Add Products to Catalog"})]}),e.jsxs("div",{style:{marginTop:"1.25rem",marginBottom:"0.65rem",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("div",{children:[e.jsx("span",{style:{fontWeight:800,fontSize:"0.95rem",color:"#0f172a"},children:"Order Line Items"}),e.jsxs("span",{style:{fontSize:"0.75rem",color:"#64748b",marginLeft:"6px"},children:["(",x.items.length," ",x.items.length===1?"item":"items",")"]})]}),e.jsxs("button",{type:"button",onClick:Te,className:"btn btn-secondary btn-sm",style:{display:"inline-flex",alignItems:"center",gap:"4px"},children:[e.jsx(he,{size:13})," Add Row"]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"3.2fr 1.1fr 1.6fr 1.1fr 1.4fr 36px",gap:"0.65rem",padding:"0.55rem 0.75rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"8px",marginBottom:"0.5rem",fontSize:"0.725rem",fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:"0.04em"},children:[e.jsx("div",{children:"Product Item *"}),e.jsx("div",{style:{textAlign:"center"},children:"Qty *"}),e.jsx("div",{children:"Unit Cost (₹) *"}),e.jsx("div",{style:{textAlign:"center"},children:"Tax / GST (%)"}),e.jsx("div",{style:{textAlign:"right"},children:"Total Amount"}),e.jsx("div",{})]}),x.items.map((t,s)=>{const r=parseInt(t.quantity,10)||0,a=parseFloat(t.unitPrice)||0,n=parseFloat(t.taxRate)||0,l=r*a*(1+n/100);return e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"3.2fr 1.1fr 1.6fr 1.1fr 1.4fr 36px",gap:"0.65rem",alignItems:"center",marginBottom:"0.5rem",background:"#ffffff",border:"1px solid #e2e8f0",padding:"0.65rem 0.75rem",borderRadius:"8px"},children:[e.jsx("div",{children:e.jsx(ae,{value:t.productId,onChange:d=>Ie(s,"productId",d.target.value),placeholder:"Select Product",size:"sm",options:[{value:"",label:"Select Product"},...y.map(d=>({value:d.id,label:`${d.name} (${d.product_code})`}))]})}),e.jsx("div",{children:e.jsx("input",{type:"number",min:"1",className:"form-input",placeholder:"Qty",value:t.quantity,onChange:d=>Ie(s,"quantity",d.target.value),required:!0,style:{padding:"0.45rem 0.5rem",textAlign:"center"}})}),e.jsx("div",{children:e.jsxs("div",{style:{position:"relative",display:"flex",alignItems:"center"},children:[e.jsx("span",{style:{position:"absolute",left:"8px",fontSize:"0.8rem",fontWeight:700,color:"#64748b",pointerEvents:"none"},children:"₹"}),e.jsx("input",{type:"number",className:"form-input",value:t.unitPrice||0,readOnly:!0,title:"Auto-filled from Product Catalog Purchase Price",style:{padding:"0.45rem 0.5rem 0.45rem 1.4rem",background:"#f1f5f9",color:"#334155",fontWeight:600,cursor:"not-allowed"}})]})}),e.jsx("div",{children:e.jsxs("div",{style:{position:"relative",display:"flex",alignItems:"center"},children:[e.jsx("input",{type:"number",className:"form-input",value:t.taxRate||0,readOnly:!0,title:"Auto-filled from Product GST Rate",style:{padding:"0.45rem 1.4rem 0.45rem 0.5rem",textAlign:"center",background:"#f1f5f9",color:"#334155",fontWeight:600,cursor:"not-allowed"}}),e.jsx("span",{style:{position:"absolute",right:"8px",fontSize:"0.75rem",fontWeight:700,color:"#64748b",pointerEvents:"none"},children:"%"})]})}),e.jsxs("div",{style:{textAlign:"right",fontWeight:700,fontSize:"0.9rem",color:"#0f172a",fontFamily:"monospace"},children:["₹",l.toLocaleString("en-IN",{maximumFractionDigits:2})]}),e.jsx("div",{style:{display:"flex",justifyContent:"center"},children:x.items.length>1&&e.jsx("button",{type:"button",onClick:()=>Oe(s),className:"btn btn-danger btn-sm",style:{padding:"0.35rem",width:"28px",height:"28px",display:"flex",alignItems:"center",justifyContent:"center"},title:"Remove Item",children:e.jsx(xe,{size:13})})})]},s)}),e.jsxs("div",{style:{marginTop:"1.25rem",padding:"1rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"10px"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",fontSize:"0.85rem",color:"#64748b",marginBottom:"0.35rem"},children:[e.jsx("span",{children:"Items Subtotal (Excl. Tax):"}),e.jsxs("span",{style:{fontWeight:600,color:"#0f172a"},children:["₹",ye().subtotal.toLocaleString("en-IN",{maximumFractionDigits:2})]})]}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",fontSize:"0.85rem",color:"#64748b",marginBottom:"0.5rem"},children:[e.jsx("span",{children:"Estimated Tax (GST):"}),e.jsxs("span",{style:{fontWeight:600,color:"#10b981"},children:["+₹",ye().taxTotal.toLocaleString("en-IN",{maximumFractionDigits:2})]})]}),e.jsxs("div",{style:{borderTop:"1px solid #e2e8f0",paddingTop:"0.65rem",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsx("span",{style:{fontSize:"1.05rem",fontWeight:800,color:"#0f172a"},children:"Total Order Value:"}),e.jsxs("span",{style:{fontSize:"1.4rem",fontWeight:800,color:"var(--primary)"},children:["₹",ye().grandTotal.toLocaleString("en-IN",{maximumFractionDigits:2})]})]})]}),e.jsxs("div",{className:"modal-footer",children:[e.jsx("button",{type:"button",onClick:()=>C(!1),className:"btn btn-secondary",children:"Cancel"}),e.jsx("button",{type:"submit",className:"btn btn-primary",children:"Create Purchase Order"})]})]})}),e.jsx(pe,{isOpen:le,onClose:()=>M(!1),title:"Add Supplier",children:e.jsxs("form",{onSubmit:Ve,children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",children:"Supplier / Company Name *"}),e.jsx("input",{type:"text",className:"form-input",value:D.name,onChange:t=>te({...D,name:t.target.value}),required:!0})]}),e.jsxs("div",{className:"form-row",children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",children:"Contact Person"}),e.jsx("input",{type:"text",className:"form-input",value:D.contactPerson,onChange:t=>te({...D,contactPerson:t.target.value})})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",children:"Phone Number *"}),e.jsx("input",{type:"tel",className:"form-input",value:D.phone,onChange:t=>te({...D,phone:t.target.value}),required:!0})]})]}),e.jsxs("div",{className:"form-row",children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",children:"Email"}),e.jsx("input",{type:"email",className:"form-input",value:D.email,onChange:t=>te({...D,email:t.target.value})})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",children:"GSTIN / Tax ID"}),e.jsx("input",{type:"text",className:"form-input",value:D.gstin,onChange:t=>te({...D,gstin:t.target.value})})]})]}),e.jsxs("div",{className:"modal-footer",children:[e.jsx("button",{type:"button",onClick:()=>M(!1),className:"btn btn-secondary",children:"Cancel"}),e.jsx("button",{type:"submit",className:"btn btn-primary",children:"Save Supplier"})]})]})}),e.jsx(pe,{isOpen:Ne,onClose:()=>T(!1),title:"Process Purchase Return",maxWidth:"820px",children:e.jsxs("form",{onSubmit:Qe,children:[e.jsxs("div",{className:"form-group",style:{marginBottom:"1rem"},children:[e.jsx("label",{className:"form-label",style:{fontWeight:700,color:"#0f172a"},children:"Select Purchase Order to Return From *"}),e.jsx(ae,{value:m.purchaseId,onChange:t=>Ue(t.target.value),placeholder:"Select Purchase Order",options:[{value:"",label:"Select Purchase Order"},...A.map(t=>({value:String(t.id),label:`${t.po_number} • ${t.supplier_name} • ₹${parseFloat(t.grand_total).toLocaleString()} (${t.warehouse_name})`}))]})]}),m.purchaseId?e.jsxs("div",{style:{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"8px",padding:"0.75rem 1rem",marginBottom:"1rem",display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"0.75rem"},children:[e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"0.725rem",color:"#64748b",display:"block",fontWeight:600},children:"Purchase Order"}),e.jsx("strong",{style:{fontSize:"0.875rem",color:"var(--primary)"},children:m.poNumber})]}),e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"0.725rem",color:"#64748b",display:"block",fontWeight:600},children:"Supplier"}),e.jsx("strong",{style:{fontSize:"0.875rem",color:"#0f172a"},children:((Ce=j.find(t=>String(t.id)===String(m.supplierId)))==null?void 0:Ce.name)||m.supplierName||"Supplier"})]}),e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"0.725rem",color:"#64748b",display:"block",fontWeight:600},children:"Warehouse Hub"}),e.jsx("strong",{style:{fontSize:"0.875rem",color:"#0f172a"},children:m.warehouseName||"Main Warehouse"})]})]}):e.jsx("div",{style:{padding:"1.5rem",textAlign:"center",color:"#64748b",background:"#f8fafc",borderRadius:"8px",border:"1px dashed #cbd5e1",marginBottom:"1rem",fontSize:"0.85rem"},children:"Please select a purchase order above to review and select items for return."}),m.purchaseId&&e.jsxs("div",{style:{marginTop:"0.5rem",marginBottom:"0.5rem"},children:[e.jsx("div",{style:{marginBottom:"0.45rem"},children:e.jsx("span",{style:{fontWeight:700,fontSize:"0.85rem",color:"#0f172a"},children:"Select Items to Return & Deduct from Stock"})}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"32px 3fr 1.2fr 1.2fr 1.4fr",gap:"0.5rem",padding:"0.45rem 0.65rem",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:"6px",fontSize:"0.725rem",fontWeight:700,color:"#475569",textTransform:"uppercase"},children:[e.jsx("div",{}),e.jsx("div",{children:"Product Item"}),e.jsx("div",{style:{textAlign:"center"},children:"Return Qty"}),e.jsx("div",{style:{textAlign:"right"},children:"Unit Price"}),e.jsx("div",{style:{textAlign:"right"},children:"Refund Amount"})]}),(m.items||[]).map((t,s)=>{const r=parseInt(t.quantity,10)||0,a=parseFloat(t.unitPrice)||0,n=r*a;return e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"32px 3fr 1.2fr 1.2fr 1.4fr",gap:"0.5rem",alignItems:"center",padding:"0.55rem 0.65rem",background:t.selected!==!1?"#ffffff":"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"6px",marginTop:"0.35rem"},children:[e.jsx("div",{children:e.jsx("input",{type:"checkbox",checked:t.selected!==!1,onChange:l=>Re(s,"selected",l.target.checked),style:{accentColor:"var(--primary)",width:"16px",height:"16px",cursor:"pointer"}})}),e.jsxs("div",{children:[e.jsx("strong",{style:{fontSize:"0.85rem",color:"#0f172a",display:"block"},children:t.productName}),e.jsxs("span",{style:{fontSize:"0.72rem",color:"#64748b"},children:["SKU: ",t.productCode," • Purchased: ",t.purchasedQty]})]}),e.jsx("div",{children:e.jsx("input",{type:"number",min:"1",max:t.purchasedQty||9999,className:"form-input",value:t.quantity,disabled:t.selected===!1,onChange:l=>Re(s,"quantity",l.target.value),required:!0,style:{padding:"0.35rem 0.5rem",textAlign:"center"}})}),e.jsxs("div",{style:{textAlign:"right",fontWeight:600,fontSize:"0.85rem",color:"#334155"},children:["₹",a.toLocaleString()]}),e.jsxs("div",{style:{textAlign:"right",fontWeight:700,fontSize:"0.875rem",color:t.selected!==!1?"#ef4444":"#94a3b8"},children:["₹",n.toLocaleString()]})]},s)})]}),m.purchaseId&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"form-row",style:{marginTop:"0.75rem"},children:[e.jsxs("div",{className:"form-group",style:{flex:1},children:[e.jsx("label",{className:"form-label",children:"Reason for Return *"}),e.jsx(ae,{value:m.reason,onChange:t=>Z({...m,reason:t.target.value}),options:[{value:"Defective / Damaged items on delivery",label:"Defective / Damaged items on delivery"},{value:"Wrong product specification delivered",label:"Wrong product specification delivered"},{value:"Excess items delivered by supplier",label:"Excess items delivered by supplier"},{value:"Quality check failure on inspection",label:"Quality check failure on inspection"},{value:"Supplier recall / Return request",label:"Supplier recall / Return request"},{value:"Other reason",label:"Other reason"}]})]}),e.jsxs("div",{className:"form-group",style:{flex:1},children:[e.jsx("label",{className:"form-label",children:"Notes / Remarks (Optional)"}),e.jsx("input",{type:"text",className:"form-input",value:m.notes,onChange:t=>Z({...m,notes:t.target.value}),placeholder:"e.g. Return authorization reference"})]})]}),e.jsxs("div",{style:{padding:"0.75rem 1rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"8px",marginTop:"0.75rem",marginBottom:"1rem",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"0.85rem",fontWeight:700,color:"#0f172a"},children:"Estimated Refund Value:"}),e.jsx("span",{style:{fontSize:"0.75rem",color:"#64748b",display:"block"},children:"Submitting creates an RMA request. Stock will only be deducted once reviewed and accepted."})]}),e.jsxs("div",{style:{fontSize:"1.3rem",fontWeight:800,color:"var(--primary)"},children:["₹",(m.items||[]).filter(t=>t.selected!==!1).reduce((t,s)=>t+(parseInt(s.quantity,10)||0)*(parseFloat(s.unitPrice)||0),0).toLocaleString()]})]})]}),e.jsxs("div",{className:"modal-footer",children:[e.jsx("button",{type:"button",onClick:()=>T(!1),className:"btn btn-secondary",children:"Cancel"}),e.jsxs("button",{type:"submit",className:"btn btn-primary",disabled:!m.purchaseId||(m.items||[]).filter(t=>t.selected!==!1).length===0,style:{display:"inline-flex",alignItems:"center",gap:"6px"},children:[e.jsx(pt,{size:14})," Submit Return Request"]})]})]})}),e.jsx(pe,{isOpen:Se,onClose:()=>{E(!1),F(null),q(!1),L("")},title:`Review Purchase Return Request (${(i==null?void 0:i.return_number)||""})`,maxWidth:"740px",children:i&&e.jsxs("div",{children:[e.jsxs("div",{style:{background:i.status==="APPROVED"?"#ecfdf5":i.status==="REJECTED"?"#fef2f2":"#fffbeb",border:`1px solid ${i.status==="APPROVED"?"#a7f3d0":i.status==="REJECTED"?"#fecaca":"#fde68a"}`,borderRadius:"8px",padding:"0.85rem 1rem",marginBottom:"1rem",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"0.725rem",color:"#64748b",display:"block",fontWeight:600},children:"RMA Status"}),e.jsx("strong",{style:{fontSize:"0.95rem",color:i.status==="APPROVED"?"#047857":i.status==="REJECTED"?"#b91c1c":"#b45309"},children:i.status==="APPROVED"?"✓ Accepted by Supplier (Live Stock Deducted)":i.status==="REJECTED"?"✕ Declined by Supplier (Stock Unaffected)":"⏳ Awaiting Supplier / Manager Review"})]}),e.jsxs("div",{style:{textAlign:"right"},children:[e.jsx("span",{style:{fontSize:"0.725rem",color:"#64748b",display:"block",fontWeight:600},children:"Total Credit / Refund"}),e.jsxs("strong",{style:{fontSize:"1.2rem",color:"#0f172a"},children:["₹",parseFloat(i.total_refund||0).toLocaleString()]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"0.75rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"8px",padding:"0.85rem 1rem",marginBottom:"1rem"},children:[e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"0.72rem",color:"#64748b",display:"block",fontWeight:600},children:"Supplier"}),e.jsx("strong",{style:{fontSize:"0.875rem",color:"#0f172a"},children:i.supplier_name})]}),e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"0.72rem",color:"#64748b",display:"block",fontWeight:600},children:"Warehouse Hub"}),e.jsx("strong",{style:{fontSize:"0.875rem",color:"#0f172a"},children:i.warehouse_name})]}),e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"0.72rem",color:"#64748b",display:"block",fontWeight:600},children:"Submitted By"}),e.jsxs("span",{style:{fontSize:"0.85rem",color:"#334155",fontWeight:600},children:[i.created_by||"Staff"," (",new Date(i.created_at||i.createdAt).toLocaleDateString(),")"]})]})]}),e.jsxs("div",{style:{marginBottom:"1rem"},children:[e.jsx("span",{style:{fontSize:"0.78rem",color:"#475569",fontWeight:700,display:"block",marginBottom:"0.25rem"},children:"Defect Reason & Inspection Notes:"}),e.jsxs("div",{style:{background:"#ffffff",border:"1px solid #e2e8f0",padding:"0.65rem 0.85rem",borderRadius:"6px",fontSize:"0.85rem",color:"#334155"},children:[e.jsx("strong",{children:i.reason}),i.notes&&e.jsxs("div",{style:{marginTop:"4px",fontSize:"0.8rem",color:"#64748b"},children:["Remarks: ",i.notes]})]})]}),i.status==="REJECTED"&&i.rejection_reason&&e.jsxs("div",{style:{marginBottom:"1rem",background:"#fef2f2",border:"1px solid #fecaca",padding:"0.65rem 0.85rem",borderRadius:"6px"},children:[e.jsxs("span",{style:{fontSize:"0.75rem",fontWeight:700,color:"#b91c1c",display:"block"},children:["Decline Rationale (by ",i.reviewed_by||"Reviewer","):"]}),e.jsx("p",{style:{margin:"3px 0 0 0",fontSize:"0.85rem",color:"#7f1d1d"},children:i.rejection_reason})]}),e.jsxs("div",{style:{marginBottom:"1.25rem"},children:[e.jsx("span",{style:{fontSize:"0.78rem",color:"#475569",fontWeight:700,display:"block",marginBottom:"0.45rem"},children:"Items Requested for Return:"}),e.jsxs("div",{style:{border:"1px solid #e2e8f0",borderRadius:"8px",overflow:"hidden"},children:[e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"3fr 1fr 1.2fr 1.2fr",padding:"0.45rem 0.75rem",background:"#f1f5f9",fontSize:"0.725rem",fontWeight:700,color:"#475569",textTransform:"uppercase"},children:[e.jsx("div",{children:"Product Item"}),e.jsx("div",{style:{textAlign:"center"},children:"Return Qty"}),e.jsx("div",{style:{textAlign:"right"},children:"Unit Price"}),e.jsx("div",{style:{textAlign:"right"},children:"Total"})]}),(i.items||[]).map((t,s)=>e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"3fr 1fr 1.2fr 1.2fr",padding:"0.6rem 0.75rem",borderTop:"1px solid #f1f5f9",fontSize:"0.85rem",alignItems:"center"},children:[e.jsxs("div",{children:[e.jsx("strong",{style:{color:"#0f172a"},children:t.product_name}),e.jsxs("span",{style:{fontSize:"0.72rem",color:"#64748b",display:"block"},children:["SKU: ",t.product_code]})]}),e.jsx("div",{style:{textAlign:"center",fontWeight:700,color:"#ef4444"},children:t.quantity}),e.jsxs("div",{style:{textAlign:"right",color:"#334155"},children:["₹",parseFloat(t.unit_price||0).toLocaleString()]}),e.jsxs("div",{style:{textAlign:"right",fontWeight:700,color:"#0f172a"},children:["₹",parseFloat(t.total_price||t.quantity*t.unit_price||0).toLocaleString()]})]},s))]})]}),ne&&(!i.status||i.status==="PENDING_APPROVAL")&&e.jsxs("div",{style:{background:"#fef2f2",border:"1px solid #fecaca",padding:"0.85rem",borderRadius:"8px",marginBottom:"1rem"},children:[e.jsx("label",{style:{fontSize:"0.8rem",fontWeight:700,color:"#991b1b",display:"block",marginBottom:"0.35rem"},children:"Specify Reason for Declining Return *"}),e.jsx("textarea",{rows:2,className:"form-input",placeholder:"e.g. Defect not covered under warranty / Damage occurred post-delivery",value:U,onChange:t=>L(t.target.value),style:{width:"100%",fontSize:"0.85rem"}})]}),e.jsxs("div",{className:"modal-footer",style:{marginTop:"0.75rem"},children:[e.jsx("button",{type:"button",onClick:()=>{E(!1),F(null),q(!1)},className:"btn btn-secondary",children:"Close"}),(!i.status||i.status==="PENDING_APPROVAL")&&e.jsxs(e.Fragment,{children:[ne?e.jsxs("button",{type:"button",onClick:()=>Ke(i.id),disabled:G,className:"btn btn-danger",style:{display:"inline-flex",alignItems:"center",gap:"5px"},children:[G?e.jsx(Ae,{size:14,className:"spin"}):e.jsx(je,{size:14})," Confirm Decline"]}):e.jsxs("button",{type:"button",onClick:()=>q(!0),className:"btn btn-danger",style:{display:"inline-flex",alignItems:"center",gap:"5px"},children:[e.jsx(je,{size:14})," Decline Return"]}),e.jsxs("button",{type:"button",onClick:()=>He(i.id),disabled:G,className:"btn btn-success",style:{display:"inline-flex",alignItems:"center",gap:"5px"},children:[G?e.jsx(Ae,{size:14,className:"spin"}):e.jsx(be,{size:14})," Accept & Deduct Stock"]})]})]})]})}),e.jsx(pe,{isOpen:ge,onClose:()=>{oe(!1),de(null)},title:"Settle Purchase Payment",maxWidth:"560px",children:v&&e.jsxs("form",{onSubmit:Be,children:[e.jsxs("div",{style:{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"8px",padding:"0.85rem 1rem",marginBottom:"1.25rem",display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:"0.75rem"},children:[e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"0.725rem",color:"#64748b",display:"block"},children:"Purchase Order"}),e.jsx("strong",{style:{fontSize:"0.875rem",color:"var(--primary)"},children:v.po_number})]}),e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"0.725rem",color:"#64748b",display:"block"},children:"Supplier / Vendor"}),e.jsx("strong",{style:{fontSize:"0.875rem",color:"#0f172a"},children:v.supplier_name})]}),e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"0.725rem",color:"#64748b",display:"block"},children:"Receiving Warehouse"}),e.jsx("span",{style:{fontSize:"0.825rem",fontWeight:600,color:"#334155"},children:v.warehouse_name})]}),e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"0.725rem",color:"#64748b",display:"block"},children:"Total Payable Due"}),e.jsxs("strong",{style:{fontSize:"1rem",color:"#0f172a",fontFamily:"monospace"},children:["₹",parseFloat(v.due_amount||v.grand_total).toLocaleString("en-IN")]})]})]}),e.jsxs("div",{className:"form-row",children:[e.jsxs("div",{className:"form-group",style:{flex:1},children:[e.jsx("label",{className:"form-label",children:"Payment Method *"}),e.jsx(ae,{value:b.paymentMethod,onChange:t=>Q({...b,paymentMethod:t.target.value}),options:[{value:"BANK_TRANSFER",label:"Bank Transfer (NEFT / RTGS)"},{value:"UPI",label:"UPI / Direct Transfer"},{value:"CARD",label:"Corporate Card"},{value:"CHEQUE",label:"Company Cheque / DD"},{value:"CASH",label:"Cash on Delivery"}]})]}),e.jsxs("div",{className:"form-group",style:{flex:1},children:[e.jsx("label",{className:"form-label",children:"Amount to Pay (₹) *"}),e.jsx("input",{type:"number",step:"0.01",min:"1",max:parseFloat(v.due_amount||v.grand_total),className:"form-input",value:b.amount,onChange:t=>Q({...b,amount:t.target.value}),required:!0})]})]}),e.jsxs("div",{className:"form-group",style:{marginBottom:"1rem"},children:[e.jsx("label",{className:"form-label",children:"Transaction Reference / Cheque No *"}),e.jsx("input",{type:"text",className:"form-input",value:b.transactionId,onChange:t=>Q({...b,transactionId:t.target.value}),placeholder:"e.g. UTR-98231048 or CHQ-004921",required:!0})]}),e.jsxs("div",{className:"form-group",style:{marginBottom:"1.25rem"},children:[e.jsx("label",{className:"form-label",children:"Notes / Remarks (Optional)"}),e.jsx("input",{type:"text",className:"form-input",value:b.notes,onChange:t=>Q({...b,notes:t.target.value}),placeholder:"e.g. Cleared against supplier invoice"})]}),v.status!=="APPROVED"&&e.jsxs("label",{style:{display:"flex",alignItems:"center",gap:"8px",fontSize:"0.8rem",fontWeight:600,color:"#334155",marginBottom:"1.25rem",cursor:"pointer"},children:[e.jsx("input",{type:"checkbox",checked:b.autoApproveStock,onChange:t=>Q({...b,autoApproveStock:t.target.checked}),style:{width:"16px",height:"16px",accentColor:"var(--primary)"}}),e.jsx("span",{children:"Automatically intake & increase warehouse stock upon payment"})]}),e.jsxs("div",{className:"modal-footer",children:[e.jsx("button",{type:"button",onClick:()=>{oe(!1),de(null)},className:"btn btn-secondary",children:"Cancel"}),e.jsxs("button",{type:"submit",className:"btn btn-primary",children:["Confirm Payment (₹",parseFloat(b.amount||0).toLocaleString("en-IN"),")"]})]})]})}),e.jsx(ut,{isOpen:w.isOpen,onClose:()=>!w.loading&&K(t=>({...t,isOpen:!1})),onConfirm:Me,title:w.title,message:w.message,itemName:w.itemName,confirmText:"Delete",variant:"danger",loading:w.loading}),e.jsx(ft,{isOpen:ue,onClose:()=>{H(!1),O(null),ee(null),me(!1)},purchase:f,paymentInfo:ce,isPaymentSuccess:_e,suppliers:j,warehouses:S,tenant:N})]})}export{Pt as default};
