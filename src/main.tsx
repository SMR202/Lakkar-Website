"use client";

import React, { useEffect, useRef, useState } from "react";

import {
  ArrowRight,
  ShoppingBag,
  X,
  Plus,
  Minus,
  Search,
  ArrowUpRight,
  Check,
  Trash2,
  Truck,
  MessageCircle,
} from "lucide-react";

import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";

import {
  money as formatMoney,
  type Catalog,
  type Product,
  type CartItem,
} from "./shared";

function Photo({
  src,
  alt,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src={src}
      alt={alt}
      {...props}
      onError={(e) => {
        if (!e.currentTarget.src.endsWith("/furniture-hero-v2.webp"))
          e.currentTarget.src = "/furniture-hero-v2.webp";
      }}
    />
  );
}

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null),
    [loadError, setLoadError] = useState(""),
    [category, setCategory] = useState("All pieces"),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("featured");

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const c = JSON.parse(localStorage.getItem("lakkar-bag") || "[]");
      return Array.isArray(c)
        ? c.filter(
            (i) =>
              typeof i.id === "string" &&
              Number.isInteger(i.quantity) &&
              i.quantity > 0 &&
              i.quantity <= 20,
          )
        : [];
    } catch {
      return [];
    }
  });

  const [panel, setPanel] = useState<
      "bag" | "checkout" | "product" | "policy" | null
    >(null),
    [product, setProduct] = useState<Product | null>(null),
    [policy, setPolicy] = useState<"delivery" | "returns" | "privacy">(
      "delivery",
    ),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [zone, setZone] = useState(""),
    [success, setSuccess] = useState<{
      id: string;
      total: number;
      whatsapp: string | null;
    } | null>(null);

  const dialog = useRef<HTMLDialogElement>(null),
    form = useRef<HTMLFormElement>(null),
    key = useRef<string>(""),
    fingerprint = useRef<string>("");

  const load = () => {
    setLoadError("");
    fetch("/api/catalog")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then(setCatalog)
      .catch(() =>
        setLoadError("The collection could not load. Please try again."),
      );
  };

  useEffect(load, []);
  useEffect(() => {
    localStorage.setItem("lakkar-bag", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (panel) {
      dialog.current?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.current?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [panel]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const money = (n: number) => formatMoney(n, catalog?.currency || "PKR");

  const site = (key: string, fallback: string) =>
    catalog?.site[key] || fallback;

  const safeLink = (url: string) => {
    try {
      return ["https:", "http:"].includes(new URL(url).protocol)
        ? url
        : "https://www.instagram.com/lakkar.home/";
    } catch {
      return "https://www.instagram.com/lakkar.home/";
    }
  };

  const close = () => {
    if (!busy) setPanel(null);
  };

  const lines = cart.map((i) => ({
    ...i,
    product: catalog?.products.find((p) => p.id === i.id),
  }));
  const subtotal = lines.reduce(
      (s, i) => s + (i.product?.price || 0) * i.quantity,
      0,
    ),
    delivery = catalog?.zones.find((z) => z.id === zone)?.fee;

  function add(p: Product) {
    const old = cart.find((i) => i.id === p.id)?.quantity || 0;
    if (old >= Math.min(p.stock, 20)) {
      setNotice("You have reached the available quantity.");
      return;
    }
    setCart((c) =>
      c.some((i) => i.id === p.id)
        ? c.map((i) => (i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...c, { id: p.id, quantity: 1 }],
    );
    setNotice(p.name + " added to your bag.");
  }

  function quantity(id: string, delta: number) {
    setCart((c) =>
      c
        .map((i) =>
          i.id === id
            ? {
                ...i,
                quantity: Math.max(
                  0,
                  Math.min(
                    20,
                    catalog?.products.find((p) => p.id === id)?.stock || 0,
                    i.quantity + delta,
                  ),
                ),
              }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }

  const products = (catalog?.products || [])
    .filter(
      (p) =>
        (category === "All pieces" || p.category === category) &&
        p.name.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : 0,
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const data = Object.fromEntries(new FormData(form.current!));
    const err: Record<string, string> = {};
    if (String(data.name).trim().length < 2) err.name = "Enter your full name.";
    if (!/^(?:\+92|0)3\d{9}$/.test(String(data.phone)))
      err.phone = "Use a mobile number such as 03001234567.";
    if (String(data.address).trim().length < 12)
      err.address = "Add your house, street and area.";
    if (String(data.city).trim().length < 2) err.city = "Enter your city.";
    if (!zone) err.zone = "Choose your delivery area.";
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email)))
      err.email = "Enter a valid email address or leave blank.";
    setErrors(err);
    if (Object.keys(err).length) {
      form.current
        ?.querySelector<HTMLElement>('[name="' + Object.keys(err)[0] + '"]')
        ?.focus();
      return;
    }

    setBusy(true);
    setError("");
    const signature = JSON.stringify({
      customer: data,
      items: cart,
      expectedTotal: subtotal + (delivery || 0),
    });
    if (!key.current || fingerprint.current !== signature) {
      key.current = crypto.randomUUID();
      fingerprint.current = signature;
    }
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: key.current,
          customer: data,
          items: cart,
          expectedTotal: subtotal + (delivery || 0),
        }),
      });
      const result = await r.json();
      if (!r.ok) {
        if (r.status === 409) load();
        throw Error(result.error);
      }
      setSuccess(result);
      setCart([]);
      key.current = "";
      load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Connection interrupted. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }

  const field = (
    name: string,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        {...props}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? name + "-error" : undefined}
      />
      {errors[name] && (
        <span id={name + "-error"} className="field-error">
          {errors[name]}
        </span>
      )}
    </div>
  );

  return (
    <>
      <a className="skip" href="#collection">
        Skip to collection
      </a>
      <div className="announcement">
        {site("announcement", "Furniture with character.")}
      </div>
      <header>
        <a className="brand" href="/" aria-label="Lakkar Home, home">
          <img src={site("logo", "/logo.jpeg")} alt="" />
          <span>
            Lakkar<small>H O M E</small>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#collection">The collection</a>
          <a href="#story">Our world</a>
          <a
            href={safeLink(
              site("instagram", "https://www.instagram.com/lakkar.home/"),
            )}
            target="_blank"
            rel="noreferrer"
          >
            Instagram <ArrowUpRight size={12} />
          </a>
        </nav>
        <button
          className="bag-button"
          onClick={() => {
            setPanel("bag");
            setSuccess(null);
          }}
          aria-label={`Open bag, ${cart.reduce((s, i) => s + i.quantity, 0)} items`}
        >
          <ShoppingBag size={21} />
          <span>Bag ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
        </button>
      </header>

      <main>
        <section className="hero">
          <Photo
            className="hero-image"
            src={site("heroImage", "/furniture-hero-v2.webp")}
            alt="A sunlit living room with sculptural walnut and upholstered furniture"
            fetchPriority="high"
          />
          <div className="hero-copy">
            <h1>{site("heroTitle", "Furniture for\nthe way you live.")}</h1>
            <p>
              {site(
                "heroText",
                "Distinctive tables, considered seating, and furniture that makes a room your own.",
              )}
            </p>
            <a className="button primary" href="#collection">
              Explore the collection <ArrowRight size={18} />
            </a>
          </div>
          <span className="hero-caption">THE ART OF FEELING AT HOME</span>
        </section>

        <div className="service-line">
          <span>
            <Truck size={17} aria-hidden="true" />
            Cash on delivery
          </span>
          <span>
            <MessageCircle size={17} aria-hidden="true" />
            Personal assistance on WhatsApp
          </span>
        </div>

        <section id="collection" className="collection">
          <div className="section-heading">
            <h2>
              {site("collectionTitle", "Find your next favourite piece.")}
            </h2>
            <p>
              {site(
                "collectionText",
                "Explore furniture for living rooms, bedrooms, and the spaces in between.",
              )}
            </p>
          </div>
          {catalog?.demo && (
            <p className="preview-note">
              Collection preview · Products, photography and prices are
              illustrative. Orders are not open yet.
            </p>
          )}

          <div className="collection-tools">
            <div
              className="filters"
              role="group"
              aria-label="Product categories"
            >
              {[
                "All pieces",
                ...new Set(catalog?.products.map((p) => p.category) || []),
              ].map((c) => (
                <button
                  key={c}
                  className={c === category ? "selected" : ""}
                  onClick={() => setCategory(c)}
                  aria-pressed={c === category}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="search-sort">
              <label className="search">
                <Search size={17} />
                <span className="sr-only">Search pieces</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find a piece"
                />
                {search && (
                  <button
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                  >
                    <X size={16} />
                  </button>
                )}
              </label>
              <label>
                <span className="sr-only">Sort products</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="low">Price: low to high</option>
                  <option value="high">Price: high to low</option>
                </select>
              </label>
            </div>
          </div>

          {!catalog && !loadError && (
            <p role="status" className="load-state">
              Gathering the collection…
            </p>
          )}
          {loadError && (
            <div role="alert" className="load-state">
              <p>{loadError}</p>
              <button className="button" onClick={load}>
                Try again
              </button>
            </div>
          )}

          <div className="product-grid">
            {products.map((p, i) => (
              <article className="product-card" key={p.id}>
                <button
                  className="product-photo"
                  onClick={() => {
                    setProduct(p);
                    setPanel("product");
                  }}
                  aria-label={"View " + p.name}
                >
                  <Photo src={p.image} alt={p.name} loading="lazy" />
                  <span>
                    Take a closer look <ArrowUpRight size={18} />
                  </span>
                </button>
                <div className="product-meta">
                  <div>
                    <p className="category">{p.category}</p>
                    <button
                      className="product-name"
                      onClick={() => {
                        setProduct(p);
                        setPanel("product");
                      }}
                    >
                      {p.name}
                    </button>
                    <p className="price">{money(p.price)}</p>
                  </div>
                  <button
                    className="add-button"
                    disabled={!p.stock}
                    aria-label={"Add " + p.name + " to bag"}
                    onClick={() => add(p)}
                  >
                    {p.stock ? <Plus size={20} /> : <span>Sold out</span>}
                  </button>
                </div>
              </article>
            ))}
          </div>
          {catalog && !products.length && (
            <div className="load-state">
              <h3>No pieces found.</h3>
              <p>Try another search or explore the full collection.</p>
              <button
                className="button"
                onClick={() => {
                  setSearch("");
                  setCategory("All pieces");
                }}
              >
                Show all pieces
              </button>
            </div>
          )}
        </section>

        <section className="story" id="story">
          <div className="story-photo">
            <Photo
              src={site("storyImage", "/furniture-story-v2.webp")}
              alt="Walnut coffee table and lounge seating in a calm interior"
              loading="lazy"
            />
          </div>
          <div className="story-copy">
            <h2>
              {site("storyTitle", "A room comes together, piece by piece.")}
            </h2>
            <p>
              {site(
                "storyText",
                "A coffee table to gather around. A chair for your quiet corner. A bed to come home to. Discover furniture that brings comfort and character to your space.",
              )}
            </p>
            <a
              href={safeLink(
                site("instagram", "https://www.instagram.com/lakkar.home/"),
              )}
              target="_blank"
              rel="noreferrer"
            >
              Step into our world <ArrowUpRight size={17} />
            </a>
          </div>
        </section>

        <section className="contact">
          <h2>{site("contactTitle", "Something on your mind?")}</h2>
          <p>
            {site(
              "contactText",
              "A question about a piece, or a little help choosing? We’d love to hear from you.",
            )}
          </p>
          {catalog?.whatsapp ? (
            <a
              className="button primary"
              href={"https://wa.me/" + catalog.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              Talk to Lakkar Home <ArrowUpRight size={17} />
            </a>
          ) : (
            <a
              className="button primary"
              href={safeLink(
                site("instagram", "https://www.instagram.com/lakkar.home/"),
              )}
              target="_blank"
              rel="noreferrer"
            >
              Find us on Instagram <ArrowUpRight size={17} />
            </a>
          )}

          {site("contactEmail", "") && (
            <p>
              <a href={"mailto:" + site("contactEmail", "")}>
                {site("contactEmail", "")}
              </a>
            </p>
          )}
        </section>
      </main>

      <footer>
        <a className="brand" href="/">
          <img src={site("logo", "/logo.jpeg")} alt="Lakkar Home logo" />
          <span>
            Lakkar<small>H O M E</small>
          </span>
        </a>
        <p>{site("tagline", "Furniture for a home that feels like you.")}</p>
        <div>
          {(["delivery", "returns", "privacy"] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPolicy(p);
                setPanel("policy");
              }}
            >
              {p === "delivery"
                ? "Delivery"
                : p === "returns"
                  ? "Returns & exchanges"
                  : "Privacy"}
            </button>
          ))}
        </div>
        <small>© {new Date().getFullYear()} Lakkar Home</small>
      </footer>

      <div className="toast" role="status">
        {notice && (
          <>
            <Check size={17} />
            {notice}
            <button
              onClick={() => {
                setPanel("bag");
                setSuccess(null);
              }}
            >
              View bag
            </button>
          </>
        )}
      </div>

      <dialog
        ref={dialog}
        className={panel === "product" ? "product-dialog" : "drawer"}
        onCancel={(e) => {
          if (busy) e.preventDefault();
          else close();
        }}
        onClose={() => setPanel(null)}
        aria-labelledby="dialog-title"
      >
        <div className="dialog-head">
          <h2 id="dialog-title">
            {panel === "bag"
              ? "Your bag"
              : panel === "checkout"
                ? success
                  ? "Thank you. It’s received."
                  : "Make it yours."
                : panel === "product"
                  ? product?.name
                  : policy === "returns"
                    ? "Returns & exchanges"
                    : policy === "delivery"
                      ? "Delivery"
                      : "Privacy"}
          </h2>
          <button
            className="icon-button"
            onClick={close}
            disabled={busy}
            aria-label="Close panel"
          >
            <X />
          </button>
        </div>

        {panel === "product" && product && (
          <div className="product-detail">
            <Photo src={product.image} alt={product.name} />
            <div>
              <p>{product.description}</p>
              <p className="detail-price">{money(product.price)}</p>
              <h3>Dimensions</h3>
              <p>{product.dimensions}</p>
              <h3>A little care</h3>
              <p>{product.care}</p>
              <button
                className="button primary"
                disabled={!product.stock}
                onClick={() => add(product)}
              >
                {product.stock ? "Add to bag" : "Sold out"} <Plus size={18} />
              </button>
            </div>
          </div>
        )}

        {panel === "policy" && (
          <p className="policy">
            {catalog?.policies[policy] ||
              "This information is temporarily unavailable. Please contact the store on Instagram."}
          </p>
        )}

        {panel === "bag" && (
          <>
            {!cart.length ? (
              <div className="empty">
                <ShoppingBag size={38} />
                <h3>A little room for something lovely.</h3>
                <p>Your bag is empty. Find a piece to make your own.</p>
                <button className="button primary" onClick={close}>
                  Explore the collection <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <>
                <div className="bag-lines">
                  {lines.map((i) => (
                    <div className="bag-line" key={i.id}>
                      <Photo
                        src={i.product?.image || "/furniture-hero-v2.webp"}
                        alt={i.product?.name || "Unavailable piece"}
                      />
                      <div>
                        <h3>{i.product?.name || "Unavailable piece"}</h3>
                        <p>{money((i.product?.price || 0) * i.quantity)}</p>
                        <div className="quantity">
                          <button
                            aria-label={"Decrease " + i.product?.name}
                            onClick={() => quantity(i.id, -1)}
                          >
                            <Minus size={14} />
                          </button>
                          <span>{i.quantity}</span>
                          <button
                            aria-label={"Increase " + i.product?.name}
                            disabled={
                              i.quantity >= Math.min(20, i.product?.stock || 0)
                            }
                            onClick={() => quantity(i.id, 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <button
                        className="icon-button"
                        aria-label={"Remove " + i.product?.name}
                        onClick={() =>
                          setCart((c) => c.filter((x) => x.id !== i.id))
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="bag-summary">
                  <p>
                    <span>Subtotal</span>
                    <strong>{money(subtotal)}</strong>
                  </p>
                  <small>
                    Delivery calculated at checkout. Pay in cash on delivery.
                  </small>
                  <button
                    className="button primary"
                    onClick={() => {
                      setPanel("checkout");
                      setSuccess(null);
                      setError("");
                      setErrors({});
                    }}
                  >
                    Continue to checkout <ArrowRight size={17} />
                  </button>
                  <button className="text-button" onClick={close}>
                    Keep exploring
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {panel === "checkout" &&
          (success ? (
            <div className="success">
              <Check size={40} />
              <h3>Your order is with us.</h3>
              <p>
                Order <strong>{success.id}</strong>
              </p>
              <p>{money(success.total)} · Cash on delivery</p>
              <p>
                The store will confirm your order and delivery details. You can
                continue the conversation on WhatsApp.
              </p>
              {success.whatsapp && (
                <a
                  className="button primary"
                  href={success.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                >
                  Continue on WhatsApp <ArrowUpRight size={18} />
                </a>
              )}
              <button className="text-button" onClick={close}>
                Back to the collection
              </button>
            </div>
          ) : (
            <form ref={form} onSubmit={submit} noValidate className="checkout">
              <p>
                Just a few details. You’ll pay in cash when your order arrives.
              </p>
              {!catalog?.ordersOpen && (
                <p className="preview-note">
                  This is a preview. Checkout is closed until the store is
                  ready.
                </p>
              )}
              <fieldset disabled={busy}>
                <legend>Delivery details</legend>
                {field("name", "Full name", {
                  autoComplete: "name",
                  maxLength: 80,
                  required: true,
                })}
                {field("phone", "Mobile / WhatsApp number", {
                  type: "tel",
                  autoComplete: "tel",
                  placeholder: "03001234567",
                  required: true,
                })}
                {field("email", "Email (optional)", {
                  type: "email",
                  autoComplete: "email",
                  maxLength: 150,
                })}
                {field("address", "House, street and area", {
                  autoComplete: "street-address",
                  maxLength: 400,
                  required: true,
                })}
                {field("city", "City", {
                  autoComplete: "address-level2",
                  maxLength: 80,
                  required: true,
                })}
                <div className="field">
                  <label htmlFor="zone">Delivery area</label>
                  <select
                    id="zone"
                    name="zone"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    aria-invalid={!!errors.zone}
                    aria-describedby={errors.zone ? "zone-error" : undefined}
                  >
                    <option value="">Choose an area</option>
                    {catalog?.zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} — {money(z.fee)}
                      </option>
                    ))}
                  </select>
                  {errors.zone && (
                    <span id="zone-error" className="field-error">
                      {errors.zone}
                    </span>
                  )}
                </div>
                {field("notes", "Delivery note (optional)", { maxLength: 500 })}
              </fieldset>
              <div className="order-summary">
                <h3>Your order</h3>
                {lines.map((i) => (
                  <p key={i.id}>
                    <span>
                      {i.product?.name} × {i.quantity}
                    </span>
                    <span>{money((i.product?.price || 0) * i.quantity)}</span>
                  </p>
                ))}
                <p>
                  <span>Delivery</span>
                  <span>
                    {delivery === undefined
                      ? "Choose an area"
                      : money(delivery)}
                  </span>
                </p>
                <p className="total">
                  <strong>Total · COD</strong>
                  <strong>{money(subtotal + (delivery || 0))}</strong>
                </p>
              </div>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <p className="form-note">
                Your details are used to fulfil your order.{" "}
                <span>Read our privacy details below.</span>
              </p>
              <details className="privacy-details">
                <summary>Privacy details</summary>
                <p>{catalog?.policies.privacy}</p>
              </details>
              <button
                className="button primary"
                disabled={busy || !catalog?.ordersOpen || !cart.length}
                type="submit"
              >
                {busy
                  ? "Placing your order…"
                  : !catalog?.ordersOpen
                    ? "Orders opening soon"
                    : "Place cash on delivery order"}{" "}
                <ArrowRight size={17} />
              </button>
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={() => setPanel("bag")}
              >
                Back to bag
              </button>
            </form>
          ))}
      </dialog>
    </>
  );
}
